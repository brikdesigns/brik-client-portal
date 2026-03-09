import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { type Industry, getReportConfigs } from '@/lib/analysis/report-config';

/**
 * POST /api/admin/reporting
 *
 * Creates a report set with empty template items for each report type.
 * Analysis is run separately per-report via /api/admin/reporting/analyze
 * to avoid timeout issues (each analyzer can take 10-30s).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = createClient();

  const body = await request.json();
  const { company_id } = body as { company_id: string };

  if (!company_id) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
  }

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('companies')
    .select('id, name, slug, industry, website_url, address, phone')
    .eq('id', company_id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Check for existing report set
  const { data: existing } = await supabase
    .from('report_sets')
    .select('id')
    .eq('company_id', company_id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Report set already exists for this client', report_set_id: existing.id },
      { status: 409 }
    );
  }

  // Create report set
  const { data: reportSet, error: rsError } = await supabase
    .from('report_sets')
    .insert({ company_id, status: 'in_progress' })
    .select('id')
    .single();

  if (rsError || !reportSet) {
    return NextResponse.json({ error: rsError?.message || 'Failed to create report set' }, { status: 500 });
  }

  // Create empty template reports + items (no analysis — instant)
  const industry = (client.industry as Industry) || null;
  const configs = getReportConfigs(industry);
  let totalItems = 0;

  for (const config of configs) {
    const maxScore = config.categories.reduce((sum, c) => sum + c.maxScore, 0);

    // Insert report row
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        report_set_id: reportSet.id,
        report_type: config.type,
        status: 'draft',
        score: null,
        max_score: maxScore,
        tier: null,
        opportunities_text: null,
      })
      .select('id')
      .single();

    if (reportError || !report) {
      console.error(`Failed to insert report ${config.type}:`, reportError);
      continue;
    }

    // Insert empty template items for this report
    const items = config.categories.map((cat, index) => ({
      report_id: report.id,
      category: cat.category,
      status: 'neutral',
      score: null,
      rating: null,
      total_reviews: null,
      feedback_summary: null,
      notes: null,
      metadata: {
        maxScore: cat.maxScore,
        ...(cat.defaultMetadata ?? {}),
      },
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from('report_items')
      .insert(items);

    if (itemsError) {
      console.error(`Failed to insert items for ${config.type}:`, itemsError);
    } else {
      totalItems += items.length;
    }
  }

  return NextResponse.json({
    report_set_id: reportSet.id,
    slug: client.slug,
    reports_created: configs.length,
    items_created: totalItems,
  });
}
