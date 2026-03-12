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
import { rateLimitOrNull, AI_GENERATION_LIMIT } from '@/lib/rate-limit';

const SECTION_TYPES = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'] as const;
const ALL_SECTION_TYPES = new Set(SECTION_TYPES);

const sectionRegenerateSchema = z.object({
  company_id: uuidSchema,
  proposal_id: z.string().uuid().optional(),
  meeting_notes_url: z.string().url().optional(),
  meeting_notes_content: z.string().optional(),
  service_ids: z.array(z.string().uuid()).min(1, 'At least one service_id is required'),
  section_type: z.enum(SECTION_TYPES),
  current_content: z.string().optional(),
});

/**
 * POST /api/admin/proposals/generate/section
 * Generate a single proposal section (1 Claude call, ~15-20s). Admin-only.
 *
 * Body: { company_id, proposal_id?, meeting_notes_content?, meeting_notes_url?, service_ids, section_type, current_content? }
 *
 * If proposal_id is provided, the generated section is appended to the proposal's
 * sections array in Supabase. When all 4 AI sections are present, generation_status
 * is set to 'completed'.
 *
 * If meeting_notes_content is provided, Notion fetch is skipped (faster).
 *
 * Returns: { section }
 */
export async function POST(request: Request) {
  const limited = rateLimitOrNull(request, 'proposal-section-regen', AI_GENERATION_LIMIT);
  if (limited) return limited;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, sectionRegenerateSchema);
  if (isValidationError(body)) return body;
  const { company_id, proposal_id, meeting_notes_url, meeting_notes_content, service_ids, section_type, current_content } = body;

  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, industry, slug')
      .eq('id', company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('full_name, first_name, email')
      .eq('company_id', company_id)
      .eq('is_primary', true)
      .single();

    // Use provided meeting notes content if available, otherwise fetch from Notion
    let meetingNotes = meeting_notes_content || '';
    if (!meetingNotes) {
      const notesResult = await getMeetingNotes({
        notionUrl: meeting_notes_url,
        clientName: !meeting_notes_url ? company.name : undefined,
      });
      meetingNotes = notesResult.content || '';
    }

    const { data: services } = await supabase
      .from('services')
      .select(`
        id, name, description,
        proposal_copy, contract_copy, included_scope, not_included, projected_timeline,
        base_price_cents, billing_frequency,
        service_categories!inner(name, slug)
      `)
      .in('id', service_ids);

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

    const section = await regenerateSection(generationInput, section_type, current_content);

    // If proposal_id provided, persist section to the proposal
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
