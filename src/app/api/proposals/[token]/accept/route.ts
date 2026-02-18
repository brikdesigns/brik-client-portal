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
  const { email } = body as { email?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Fetch proposal
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, status, valid_until')
    .eq('token', token)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Validate state
  if (proposal.status === 'accepted') {
    return NextResponse.json({ error: 'Proposal has already been accepted' }, { status: 400 });
  }

  if (proposal.status === 'expired' || proposal.status === 'declined') {
    return NextResponse.json({ error: `Proposal is ${proposal.status}` }, { status: 400 });
  }

  if (proposal.valid_until) {
    const expiry = new Date(proposal.valid_until);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      await supabase
        .from('proposals')
        .update({ status: 'expired' })
        .eq('id', proposal.id);
      return NextResponse.json({ error: 'Proposal has expired' }, { status: 400 });
    }
  }

  // Capture audit trail
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by_email: email,
      accepted_by_ip: ip,
      accepted_by_user_agent: userAgent,
    })
    .eq('id', proposal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
