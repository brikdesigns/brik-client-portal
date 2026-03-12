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
  scope_items: z.array(z.object({
    service_id: z.string().nullable().optional(),
    service_name: z.string(),
    category_slug: z.string(),
    included: z.array(z.string()),
    not_included: z.array(z.string()),
    timeline: z.string().nullable().optional(),
  })).optional(),
  timeline_phases: z.array(z.object({
    phase_label: z.string(),
    deliverables: z.array(z.string()),
  })).optional(),
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

  // Validate: all service_ids in items actually exist in the services table
  const itemServiceIds = items.map(i => i.service_id).filter((id): id is string => !!id);
  if (itemServiceIds.length > 0) {
    const { data: validServices, error: svcErr } = await supabase
      .from('services')
      .select('id')
      .in('id', itemServiceIds);

    if (svcErr) {
      console.error('[proposal-save] Service validation query failed:', svcErr.message);
      return NextResponse.json({ error: 'Failed to validate services' }, { status: 500 });
    }

    const validIds = new Set((validServices ?? []).map(s => s.id));
    const invalid = itemServiceIds.filter(id => !validIds.has(id));
    if (invalid.length > 0) {
      console.warn('[proposal-save] Rejected: invalid service_ids in items:', invalid);
      return NextResponse.json(
        { error: `Invalid service IDs in line items: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }
  }

  // Validate: scope_items in sections only reference services that are in the line items
  if (sections && sections.length > 0) {
    const lineItemServiceIds = new Set(itemServiceIds);
    const scopeSection = sections.find(s => s.type === 'scope_of_project');
    if (scopeSection) {
      const rawSections = scopeSection as unknown as { scope_items?: { service_id?: string; service_name?: string }[] };
      const scopeServiceIds = (rawSections.scope_items ?? [])
        .map(si => si.service_id)
        .filter((id): id is string => !!id);
      const orphanedScope = scopeServiceIds.filter(id => !lineItemServiceIds.has(id));
      if (orphanedScope.length > 0) {
        console.warn('[proposal-save] Scope/line-item mismatch:', {
          scopeServiceIds,
          lineItemServiceIds: [...lineItemServiceIds],
          orphaned: orphanedScope,
        });
      }
    }
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
