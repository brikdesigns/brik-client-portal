import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMeetingNotes } from '@/lib/notion-fetch';
import {
  regenerateSection,
  type ServiceDetail,
  type ProposalGenerationInput,
} from '@/lib/proposal-generation';

/**
 * POST /api/admin/proposals/generate/section
 * Regenerate a single proposal section. Admin-only.
 *
 * Body: { company_id, meeting_notes_url?, service_ids, section_type, current_content? }
 * Returns: { section }
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
  const { company_id, meeting_notes_url, service_ids, section_type, current_content } = body as {
    company_id: string;
    meeting_notes_url?: string;
    service_ids: string[];
    section_type: 'overview_and_goals' | 'scope_of_project' | 'project_timeline' | 'why_brik';
    current_content?: string;
  };

  const validTypes = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'];
  if (!company_id || !service_ids?.length || !validTypes.includes(section_type)) {
    return NextResponse.json(
      { error: 'company_id, service_ids, and a valid section_type are required' },
      { status: 400 }
    );
  }

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
      .select('name, email')
      .eq('company_id', company_id)
      .eq('is_primary', true)
      .single();

    const notesResult = await getMeetingNotes({
      notionUrl: meeting_notes_url,
      clientName: !meeting_notes_url ? company.name : undefined,
    });

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
      contactName: contact?.name || 'the team',
      meetingNotes: notesResult.content || '',
      services: serviceDetails,
    };

    const section = await regenerateSection(generationInput, section_type, current_content);

    return NextResponse.json({ section });
  } catch (err) {
    console.error('Section regeneration failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
