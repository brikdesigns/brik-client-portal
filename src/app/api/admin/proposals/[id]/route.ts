import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ProposalItem {
  id?: string;
  service_id?: string;
  name: string;
  description?: string;
  quantity?: number;
  unit_price_cents: number;
  sort_order?: number;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const {
    title, valid_until, notes, sections,
    meeting_notes_url, meeting_notes_content,
    total_amount_cents, items,
  } = body as {
    title?: string;
    valid_until?: string | null;
    notes?: string | null;
    sections?: Array<{ type: string; title: string; content: string | null; sort_order: number }>;
    meeting_notes_url?: string | null;
    meeting_notes_content?: string | null;
    total_amount_cents?: number;
    items?: ProposalItem[];
  };

  // Update proposal fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (valid_until !== undefined) updates.valid_until = valid_until;
  if (notes !== undefined) updates.notes = notes;
  if (sections !== undefined) {
    updates.sections = sections;
    if (sections.length > 0 && sections.some(s => s.content)) {
      updates.generation_status = 'completed';
      updates.generated_at = new Date().toISOString();
    }
  }
  if (meeting_notes_url !== undefined) updates.meeting_notes_url = meeting_notes_url;
  if (meeting_notes_content !== undefined) updates.meeting_notes_content = meeting_notes_content;
  if (total_amount_cents !== undefined) updates.total_amount_cents = total_amount_cents;

  const { error: updateError } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Replace line items if provided
  if (items) {
    // Delete existing items
    await supabase
      .from('proposal_items')
      .delete()
      .eq('proposal_id', id);

    // Insert new items
    const itemRows = items.map((item, index) => ({
      proposal_id: id,
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
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
