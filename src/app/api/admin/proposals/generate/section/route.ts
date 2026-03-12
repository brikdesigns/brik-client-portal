import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { getMeetingNotes } from '@/lib/notion-fetch';
import {
  regenerateSection,
  type ServiceDetail,
  type ProposalGenerationInput,
  type GeneratedSection,
} from '@/lib/proposal-generation';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';
import { rateLimitOrNull, AI_SECTION_LIMIT } from '@/lib/rate-limit';

const SECTION_TYPES = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'] as const;
const ALL_SECTION_TYPES = new Set(SECTION_TYPES);

// Two input modes:
// 1. Pipeline mode: { proposal_id, section_type } — derives everything from DB (lightweight)
// 2. Standalone mode: { company_id, service_ids, section_type, meeting_notes_url? } — for ad-hoc regeneration
const sectionSchema = z.object({
  proposal_id: z.string().uuid().optional(),
  company_id: uuidSchema.optional(),
  meeting_notes_url: z.string().url().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  section_type: z.enum(SECTION_TYPES),
  current_content: z.string().optional(),
}).refine(
  (data) => data.proposal_id || (data.company_id && data.service_ids && data.service_ids.length > 0),
  { message: 'Either proposal_id or (company_id + service_ids) is required' }
);

/**
 * POST /api/admin/proposals/generate/section
 * Generate a single proposal section (1 Claude call, ~15-20s). Admin-only.
 *
 * Two input modes (keeps payloads small):
 *
 * **Pipeline mode** (preferred — minimal payload):
 *   Body: { proposal_id, section_type }
 *   Derives company, services, and meeting notes from the proposal row.
 *   Appends the generated section to the proposal's sections array.
 *   Marks generation_status='completed' when all 4 sections are present.
 *
 * **Standalone mode** (for ad-hoc regeneration without a saved proposal):
 *   Body: { company_id, service_ids, section_type, meeting_notes_url?, current_content? }
 *   Fetches meeting notes from Notion. Does NOT persist to any proposal.
 *
 * Returns: { section }
 */
export async function POST(request: Request) {
  const limited = rateLimitOrNull(request, 'proposal-section-gen', AI_SECTION_LIMIT);
  if (limited) return limited;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, sectionSchema);
  if (isValidationError(body)) return body;
  const { proposal_id, company_id: bodyCompanyId, meeting_notes_url, service_ids: bodyServiceIds, section_type, current_content } = body;

  try {
    let companyId: string;
    let serviceIds: string[];
    let meetingNotes: string;

    if (proposal_id) {
      // Pipeline mode: read everything from the proposal + its line items
      const resolved = await resolveFromProposal(supabase, proposal_id);
      if ('error' in resolved) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status });
      }
      companyId = resolved.companyId;
      serviceIds = resolved.serviceIds;
      meetingNotes = resolved.meetingNotes;
    } else {
      // Standalone mode: use body params + fetch meeting notes from Notion
      companyId = bodyCompanyId!;
      serviceIds = bodyServiceIds!;
      meetingNotes = '';
    }

    // Fetch company + contact
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, industry, slug')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('full_name, first_name, email')
      .eq('company_id', companyId)
      .eq('is_primary', true)
      .single();

    // Standalone mode: fetch meeting notes from Notion
    if (!meetingNotes) {
      const notesResult = await getMeetingNotes({
        notionUrl: meeting_notes_url,
        clientName: !meeting_notes_url ? company.name : undefined,
      });
      meetingNotes = notesResult.content || '';
    }

    // Fetch service details
    const { data: services } = await supabase
      .from('services')
      .select(`
        id, name, description,
        proposal_copy, contract_copy, included_scope, not_included, projected_timeline,
        base_price_cents, billing_frequency,
        service_categories!inner(name, slug)
      `)
      .in('id', serviceIds);

    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'No services found' }, { status: 400 });
    }

    const serviceDetails: ServiceDetail[] = services.map(s => {
      const category = s.service_categories as unknown as { name: string; slug: string } | null;
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        proposal_copy: s.proposal_copy,
        contract_copy: s.contract_copy,
        included_scope: s.included_scope,
        not_included: s.not_included,
        projected_timeline: s.projected_timeline,
        base_price_cents: s.base_price_cents || 0,
        billing_frequency: s.billing_frequency,
        category_name: category?.name || null,
        category_slug: category?.slug || null,
      };
    });

    const generationInput: ProposalGenerationInput = {
      companyName: company.name,
      companyIndustry: company.industry,
      contactName: contact?.first_name || contact?.full_name || 'the team',
      meetingNotes,
      services: serviceDetails,
    };

    const startTime = Date.now();
    const section = await regenerateSection(generationInput, section_type, current_content);
    const duration = Date.now() - startTime;
    console.log(`[section-gen] ${section_type} for ${company.name}: ${duration}ms`);

    // Pipeline mode: persist section to the proposal
    if (proposal_id) {
      await appendSectionToProposal(supabase, proposal_id, section);
    }

    return NextResponse.json({ section });
  } catch (err) {
    console.error('Section generation failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Resolve company_id, service_ids, and meeting_notes from a proposal row.
 * Single DB round-trip for the proposal, one more for line items.
 */
async function resolveFromProposal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proposalId: string,
): Promise<{ companyId: string; serviceIds: string[]; meetingNotes: string } | { error: string; status: number }> {
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('company_id, meeting_notes_content, sections')
    .eq('id', proposalId)
    .single();

  if (error || !proposal) {
    return { error: 'Proposal not found', status: 404 };
  }

  // Get service IDs from line items
  const { data: items } = await supabase
    .from('proposal_items')
    .select('service_id')
    .eq('proposal_id', proposalId)
    .not('service_id', 'is', null);

  const serviceIds = (items || []).map(i => i.service_id).filter((id): id is string => !!id);
  if (serviceIds.length === 0) {
    return { error: 'No services found on proposal', status: 400 };
  }

  return {
    companyId: proposal.company_id,
    serviceIds,
    meetingNotes: proposal.meeting_notes_content || '',
  };
}

/**
 * Append a generated section to the proposal's sections array.
 * Replaces any existing section of the same type.
 * When all 4 AI sections are present, marks generation as completed.
 */
async function appendSectionToProposal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proposalId: string,
  section: GeneratedSection,
) {
  // Fetch current sections
  const { data: proposal } = await supabase
    .from('proposals')
    .select('sections')
    .eq('id', proposalId)
    .single();

  const existing = (proposal?.sections as GeneratedSection[] | null) || [];

  // Replace existing section of same type, or append
  const filtered = existing.filter(s => s.type !== section.type);
  filtered.push(section);

  // Check if all 4 AI sections are now present
  const presentTypes = new Set(filtered.map(s => s.type));
  const allComplete = [...ALL_SECTION_TYPES].every(t => presentTypes.has(t));

  // Add fee_summary placeholder if completing
  if (allComplete && !presentTypes.has('fee_summary')) {
    filtered.push({ type: 'fee_summary', title: 'Fee Summary', content: '', sort_order: 5 });
  }

  // Sort by sort_order
  filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const updateData: Record<string, unknown> = { sections: filtered };
  if (allComplete) {
    updateData.generation_status = 'completed';
    updateData.generated_at = new Date().toISOString();
  }

  await supabase
    .from('proposals')
    .update(updateData)
    .eq('id', proposalId);
}
