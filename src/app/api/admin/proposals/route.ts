import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { parseBody, isValidationError, nonEmptyString, uuidSchema } from '@/lib/validation';
import crypto from 'crypto';

const proposalItemSchema = z.object({
  service_id: z.string().uuid().optional(),
  name: nonEmptyString,
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

const proposalSchema = z.object({
  company_id: uuidSchema,
  title: nonEmptyString,
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(proposalItemSchema).min(1, 'At least one item is required'),
  sections: z.array(sectionSchema).optional(),
  meeting_notes_url: z.string().url().optional().or(z.literal('')),
  meeting_notes_content: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, proposalSchema);
  if (isValidationError(body)) return body;
  const { company_id, title, valid_until, notes, items, sections, meeting_notes_url, meeting_notes_content } = body;

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
