import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Public route — uses service role key to bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getServiceClient();

  const { data: agreement, error } = await supabase
    .from('agreements')
    .select(`
      id, type, title, status, token, content_snapshot, valid_until,
      signed_at, signed_by_name, signed_by_email,
      first_viewed_at, view_count, sent_at, created_at,
      companies(name, contact_email)
    `)
    .eq('token', token)
    .single();

  if (error || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  // Track views — only update if status is 'sent' or 'viewed'
  if (agreement.status === 'sent' || agreement.status === 'viewed') {
    const updates: Record<string, unknown> = {
      view_count: (agreement.view_count || 0) + 1,
    };

    if (agreement.status === 'sent') {
      updates.status = 'viewed';
      updates.first_viewed_at = new Date().toISOString();
    }

    await supabase
      .from('agreements')
      .update(updates)
      .eq('id', agreement.id);
  }

  return NextResponse.json({ agreement });
}
