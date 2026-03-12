import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { parseBody, isValidationError } from '@/lib/validation';

const proposalItemSchema = z.object({
  id: z.string().optional(),
  service_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  unit_price_cents: z.number().int(),
  sort_order: z.number().int().optional(),
});

const sectionSchema = z.object({
  type: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  sort_order: z.number().int(),
});

const patchProposalSchema = z.object({
  title: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sections: z.array(sectionSchema).optional(),
  meeting_notes_url: z.string().nullable().optional(),
  meeting_notes_content: z.string().nullable().optional(),
  total_amount_cents: z.number().int().optional(),
  items: z.array(proposalItemSchema).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, patchProposalSchema);
  if (isValidationError(body)) return body;
  const {
    title, valid_until, notes, sections,
    meeting_notes_url, meeting_notes_content,
    total_amount_cents, items,
  } = body;

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
