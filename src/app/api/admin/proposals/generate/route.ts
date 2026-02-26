import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMeetingNotes, searchMeetingByClientName } from '@/lib/notion-fetch';
import {
  generateProposalSections,
  type ServiceDetail,
  type ProposalGenerationInput,
} from '@/lib/proposal-generation';

/**
 * POST /api/admin/proposals/generate
 * AI-generates 4 proposal sections from meeting notes + service catalog.
 * Admin-only endpoint.
 *
 * Body: { company_id, meeting_notes_url?, service_ids }
 * Returns: { sections, meeting_notes_content, meeting_notes_url }
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
  const { company_id, meeting_notes_url, service_ids } = body as {
    company_id: string;
    meeting_notes_url?: string;
    service_ids: string[];
  };

  if (!company_id || !service_ids || service_ids.length === 0) {
    return NextResponse.json(
      { error: 'company_id and at least one service_id are required' },
      { status: 400 }
    );
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

    // 2. Fetch meeting notes from Notion
    const notesResult = await getMeetingNotes({
      notionUrl: meeting_notes_url,
      clientName: !meeting_notes_url ? company.name : undefined,
    });

    if (!notesResult.content || notesResult.content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Meeting notes are too short or empty. Ensure the Notion page has content.' },
        { status: 400 }
      );
    }

    // 3. Fetch services with full catalog fields
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id, name, description,
        proposal_copy, contract_copy, included_scope, not_included, projected_timeline,
        base_price_cents, billing_frequency,
        service_categories!inner(name, slug)
      `)
      .in('id', service_ids);

    if (servicesError || !services || services.length === 0) {
      return NextResponse.json({ error: 'No services found for the provided IDs' }, { status: 400 });
    }

    // Map services to the format expected by the generation engine
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

    // 4. Generate proposal sections via Claude API
    const generationInput: ProposalGenerationInput = {
      companyName: company.name,
      companyIndustry: company.industry,
      contactName: contact?.name || 'the team',
      meetingNotes: notesResult.content,
      services: serviceDetails,
    };

    const generated = await generateProposalSections(generationInput);

    // Build sections array with fee_summary placeholder
    const sections = [
      generated.overview_and_goals,
      generated.scope_of_project,
      generated.project_timeline,
      generated.why_brik,
      {
        type: 'fee_summary',
        title: 'Fee Summary',
        content: null,
        sort_order: 5,
      },
    ];

    return NextResponse.json({
      sections,
      meeting_notes_content: notesResult.content,
      meeting_notes_url: notesResult.url || meeting_notes_url,
      services: serviceDetails,
    });
  } catch (err) {
    console.error('Proposal generation failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/admin/proposals/generate?company_id=...
 * Search Notion for meeting notes by company name.
 * Returns matching meeting pages for the admin to select.
 */
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const companyId = url.searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  try {
    const results = await searchMeetingByClientName(company.name);
    return NextResponse.json({ meetings: results, companyName: company.name });
  } catch (err) {
    console.error('Notion search failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
