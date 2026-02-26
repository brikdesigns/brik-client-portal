import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface ProposalItem {
  service_id?: string;
  name: string;
  description?: string;
  quantity?: number;
  unit_price_cents: number;
  sort_order?: number;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { company_id, title, valid_until, notes, items, sections, meeting_notes_url, meeting_notes_content } = body as {
    company_id: string;
    title: string;
    valid_until?: string;
    notes?: string;
    items: ProposalItem[];
    sections?: Array<{ type: string; title: string; content: string | null; sort_order: number }>;
    meeting_notes_url?: string;
    meeting_notes_content?: string;
  };

  if (!company_id || !title || !items || items.length === 0) {
    return NextResponse.json(
      { error: 'company_id, title, and at least one item are required' },
      { status: 400 }
    );
  }

  const token = crypto.randomUUID();
  const total_amount_cents = items.reduce(
    (sum, item) => sum + item.unit_price_cents * (item.quantity || 1),
    0
  );

  // Insert proposal
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      company_id,
      title,
      token,
      valid_until: valid_until || null,
      notes: notes || null,
      total_amount_cents,
      sections: sections || [],
      meeting_notes_url: meeting_notes_url || null,
      meeting_notes_content: meeting_notes_content || null,
      generation_status: sections && sections.length > 0 ? 'completed' : 'none',
      generated_at: sections && sections.length > 0 ? new Date().toISOString() : null,
    })
    .select('id, token')
    .single();

  if (proposalError) {
    return NextResponse.json({ error: proposalError.message }, { status: 400 });
  }

  // Insert line items
  const itemRows = items.map((item, index) => ({
    proposal_id: proposal.id,
    service_id: item.service_id || null,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity || 1,
    unit_price_cents: item.unit_price_cents,
    sort_order: item.sort_order ?? index,
  }));

  const { error: itemsError } = await supabase
    .from('proposal_items')
    .insert(itemRows);

  if (itemsError) {
    // Cleanup: delete the proposal if items failed
    await supabase.from('proposals').delete().eq('id', proposal.id);
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ proposal });
}
