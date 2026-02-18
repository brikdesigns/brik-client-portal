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

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      id, title, status, token, valid_until, total_amount_cents,
      first_viewed_at, view_count, accepted_at, accepted_by_email,
      sent_at, created_at,
      clients(name, contact_email),
      proposal_items(id, name, description, quantity, unit_price_cents, sort_order)
    `)
    .eq('token', token)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Track views — only update if status is 'sent' or 'viewed'
  if (proposal.status === 'sent' || proposal.status === 'viewed') {
    const updates: Record<string, unknown> = {
      view_count: (proposal.view_count || 0) + 1,
    };

    if (proposal.status === 'sent') {
      updates.status = 'viewed';
      updates.first_viewed_at = new Date().toISOString();
    }

    await supabase
      .from('proposals')
      .update(updates)
      .eq('id', proposal.id);
  }

  return NextResponse.json({ proposal });
}
