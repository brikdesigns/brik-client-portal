import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceClient();

  const body = await request.json();
  const { name, email } = body as { name?: string; email?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Full legal name is required' }, { status: 400 });
  }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
  }

  // Fetch agreement
  const { data: agreement, error } = await supabase
    .from('agreements')
    .select('id, status, valid_until')
    .eq('token', token)
    .single();

  if (error || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  // Validate state
  if (agreement.status === 'signed') {
    return NextResponse.json({ error: 'Agreement has already been signed' }, { status: 400 });
  }

  if (agreement.status === 'expired') {
    return NextResponse.json({ error: 'Agreement has expired' }, { status: 400 });
  }

  if (agreement.status === 'draft') {
    return NextResponse.json({ error: 'Agreement has not been sent yet' }, { status: 400 });
  }

  if (agreement.valid_until) {
    const expiry = new Date(agreement.valid_until);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      await supabase
        .from('agreements')
        .update({ status: 'expired' })
        .eq('id', agreement.id);
      return NextResponse.json({ error: 'Agreement has expired' }, { status: 400 });
    }
  }

  // Capture ESIGN audit trail
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error: updateError } = await supabase
    .from('agreements')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by_name: name.trim(),
      signed_by_email: email.trim(),
      signed_by_ip: ip,
      signed_by_user_agent: userAgent,
    })
    .eq('id', agreement.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
