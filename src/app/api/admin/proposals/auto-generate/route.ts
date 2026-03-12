import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { fetchMeetingNotes } from '@/lib/notion-fetch';
import { recommendServices, type CatalogService } from '@/lib/service-recommendation';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';
import { rateLimitOrNull, AI_GENERATION_LIMIT } from '@/lib/rate-limit';
import crypto from 'crypto';

const autoGenerateSchema = z.object({
  company_id: uuidSchema,
  meeting_note_page_id: z.string().min(1, 'A meeting note must be selected'),
  title: z.string().min(1).optional(),
});

/**
 * POST /api/admin/proposals/auto-generate
 * Step 1 of proposal generation — recommend services + create proposal shell.
 * Section content is generated client-side via sequential /generate/section calls.
 *
 * Pipeline (all fast — no multi-section AI generation):
 *   1. Fetch company + primary contact from Supabase
 *   2. Fetch meeting notes content from Notion
 *   3. Fetch service catalog from Supabase
 *   4. AI recommends services (1 Claude call, ~10-15s)
 *   5. Create proposal shell + line items in Supabase
 *
 * Returns: { proposal_id, company_id, slug, service_ids, meeting_notes_content }
 * Client then calls /api/admin/proposals/generate/section for each section.
 */
export async function POST(request: Request) {
  const limited = rateLimitOrNull(request, 'proposal-auto-generate', AI_GENERATION_LIMIT);
  if (limited) return limited;

  const auth = await requireAdmin();
  if (isAuthError(auth)) {
    console.error('Auto-generate: auth failed');
    return auth;
  }

  const supabase = await createClient();

  const body = await parseBody(request, autoGenerateSchema);
  if (isValidationError(body)) return body;
  const { company_id, meeting_note_page_id, title: customTitle } = body;

  try {
    // 1. Fetch company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, industry, slug')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Fetch meeting notes from Notion
    const content = await fetchMeetingNotes(meeting_note_page_id);

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        {
          error: 'The selected meeting note has insufficient content (less than 50 characters).',
          error_code: 'NO_MEETING_NOTES',
          company_name: company.name,
        },
        { status: 400 }
      );
    }

    // 3. Fetch full service catalog
    const { data: allServices, error: svcError } = await supabase
      .from('services')
      .select(`
        id, name, description, proposal_copy, included_scope, not_included,
        projected_timeline, base_price_cents, billing_frequency, service_type,
        service_categories!inner(name, slug)
      `)
      .order('name');

    if (svcError || !allServices || allServices.length === 0) {
      return NextResponse.json({ error: 'Service catalog is empty' }, { status: 400 });
    }

    // Map for recommendation engine
    const catalogServices: CatalogService[] = allServices.map(s => {
      const cat = s.service_categories as unknown as { name: string; slug: string } | null;
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        proposal_copy: s.proposal_copy,
        included_scope: s.included_scope,
        base_price_cents: s.base_price_cents,
        billing_frequency: s.billing_frequency,
        service_type: s.service_type,
        category_name: cat?.name || null,
        category_slug: cat?.slug || null,
      };
    });

    // 4. AI recommends services (1 Claude call — fits within Netlify 26s limit)
    const recommendations = await recommendServices(content, catalogServices);

    if (recommendations.length === 0) {
      return NextResponse.json(
        { error: 'AI could not identify relevant services from the meeting notes. Use the manual proposal builder.' },
        { status: 400 }
      );
    }

    const recommendedIds = recommendations.map(r => r.service_id);
    const recommendedServices = allServices.filter(s => recommendedIds.includes(s.id));

    // 5. Create proposal shell (no sections yet — client generates them one by one)
    const token = crypto.randomUUID();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const totalAmountCents = recommendedServices.reduce(
      (sum, s) => sum + (s.base_price_cents || 0),
      0
    );

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        company_id,
        title: customTitle || `Proposal for ${company.name}`,
        token,
        valid_until: validUntil.toISOString().split('T')[0],
        total_amount_cents: totalAmountCents,
        sections: [],
        meeting_notes_content: content,
        generation_status: 'pending',
      })
      .select('id, token')
      .single();

    if (proposalError) {
      return NextResponse.json({ error: proposalError.message }, { status: 400 });
    }

    // Create line items from recommended services
    const itemRows = recommendedServices.map((s, index) => ({
      proposal_id: proposal.id,
      service_id: s.id,
      name: s.name,
      description: s.description || null,
      quantity: 1,
      unit_price_cents: s.base_price_cents || 0,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from('proposal_items')
      .insert(itemRows);

    if (itemsError) {
      await supabase.from('proposals').delete().eq('id', proposal.id);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    // Return everything the client needs to orchestrate section generation
    return NextResponse.json({
      proposal_id: proposal.id,
      company_id: company.id,
      slug: company.slug,
      service_ids: recommendedIds,
      meeting_notes_content: content,
    });
  } catch (err) {
    console.error('Auto-generate pipeline failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
