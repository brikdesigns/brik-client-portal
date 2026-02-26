import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMeetingNotes } from '@/lib/notion-fetch';
import { recommendServices, type CatalogService } from '@/lib/service-recommendation';
import {
  generateProposalSections,
  type ServiceDetail,
  type ProposalGenerationInput,
} from '@/lib/proposal-generation';
import crypto from 'crypto';

/**
 * POST /api/admin/proposals/auto-generate
 * One-click proposal generation pipeline. Admin-only.
 *
 * Input: { company_id }
 * Pipeline:
 *   1. Fetch company + primary contact
 *   2. Search Notion for meeting notes by company name
 *   3. Fetch full service catalog
 *   4. AI recommends services based on meeting notes
 *   5. AI generates 4 proposal sections
 *   6. Creates proposal + line items in Supabase
 *   7. Returns proposal ID for redirect
 *
 * Returns: { proposal_id, token, slug, recommendations }
 */
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
  const { company_id } = body as { company_id: string };

  if (!company_id) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
  }

  try {
    // 1. Fetch company + primary contact
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, industry, slug')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('name, email')
      .eq('company_id', company_id)
      .eq('is_primary', true)
      .single();

    // 2. Search Notion for meeting notes by company name
    const notesResult = await getMeetingNotes({ clientName: company.name });

    if (!notesResult.content || notesResult.content.trim().length < 50) {
      return NextResponse.json(
        {
          error: `No meeting notes found for "${company.name}" in Notion. Create a discovery call page titled with the company name, or use the manual proposal builder.`,
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

    // 4. AI recommends services
    const recommendations = await recommendServices(notesResult.content, catalogServices);

    if (recommendations.length === 0) {
      return NextResponse.json(
        { error: 'AI could not identify relevant services from the meeting notes. Use the manual proposal builder.' },
        { status: 400 }
      );
    }

    const recommendedIds = recommendations.map(r => r.service_id);

    // 5. Build service details for proposal generation
    const recommendedServices = allServices.filter(s => recommendedIds.includes(s.id));
    const serviceDetails: ServiceDetail[] = recommendedServices.map(s => {
      const cat = s.service_categories as unknown as { name: string; slug: string } | null;
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        proposal_copy: s.proposal_copy,
        contract_copy: null,
        included_scope: s.included_scope,
        not_included: s.not_included,
        projected_timeline: s.projected_timeline,
        base_price_cents: s.base_price_cents || 0,
        billing_frequency: s.billing_frequency,
        category_name: cat?.name || null,
        category_slug: cat?.slug || null,
      };
    });

    // 6. AI generates 4 proposal sections
    const generationInput: ProposalGenerationInput = {
      companyName: company.name,
      companyIndustry: company.industry,
      contactName: contact?.name || 'the team',
      meetingNotes: notesResult.content,
      services: serviceDetails,
    };

    const generated = await generateProposalSections(generationInput);

    const sections = [
      generated.overview_and_goals,
      generated.scope_of_project,
      generated.project_timeline,
      generated.why_brik,
      { type: 'fee_summary', title: 'Fee Summary', content: null, sort_order: 5 },
    ];

    // 7. Create proposal in Supabase
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
        title: `Proposal for ${company.name}`,
        token,
        valid_until: validUntil.toISOString().split('T')[0],
        total_amount_cents: totalAmountCents,
        sections,
        meeting_notes_url: notesResult.url || null,
        meeting_notes_content: notesResult.content,
        generation_status: 'completed',
        generated_at: new Date().toISOString(),
      })
      .select('id, token')
      .single();

    if (proposalError) {
      return NextResponse.json({ error: proposalError.message }, { status: 400 });
    }

    // 8. Create line items from recommended services
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

    return NextResponse.json({
      proposal_id: proposal.id,
      token: proposal.token,
      slug: company.slug,
      recommendations: recommendations.map(r => ({
        service_id: r.service_id,
        service_name: catalogServices.find(s => s.id === r.service_id)?.name,
        reason: r.reason,
      })),
    });
  } catch (err) {
    console.error('Auto-generate pipeline failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
