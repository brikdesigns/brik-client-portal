import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type Industry, WEBSITE_CONFIG } from '@/lib/analysis/report-config';
import { analyzeWebsite, type WebsiteCheckResult } from '@/lib/analysis/website';
import { analyzeBrand } from '@/lib/analysis/brand';
import { analyzeReviews } from '@/lib/analysis/reviews';
import { analyzeCompetitors } from '@/lib/analysis/competitors';
import { recalculateReportScore, recalculateReportSetScore } from '@/lib/analysis/scoring';

const ANALYZABLE_TYPES = ['website', 'brand_logo', 'online_reviews', 'competitors'];

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
  const { report_id, report_type } = body as { report_id: string; report_type: string };

  if (!report_id || !report_type) {
    return NextResponse.json({ error: 'report_id and report_type are required' }, { status: 400 });
  }

  if (!ANALYZABLE_TYPES.includes(report_type)) {
    return NextResponse.json({ error: `Report type "${report_type}" does not support auto-analysis` }, { status: 400 });
  }

  // Fetch report → report_set → client chain
  const { data: report } = await supabase
    .from('reports')
    .select('id, report_set_id')
    .eq('id', report_id)
    .single();

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const { data: reportSet } = await supabase
    .from('report_sets')
    .select('id, company_id')
    .eq('id', report.report_set_id)
    .single();

  if (!reportSet) {
    return NextResponse.json({ error: 'Report set not found' }, { status: 404 });
  }

  const { data: client } = await supabase
    .from('companies')
    .select('id, name, industry, website_url, address, phone')
    .eq('id', reportSet.company_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Run the appropriate analyzer
  let results: WebsiteCheckResult[];

  try {
    switch (report_type) {
      case 'website':
        if (!client.website_url) {
          return NextResponse.json({ error: 'Client has no website URL' }, { status: 400 });
        }
        results = await analyzeWebsite(client.website_url);
        break;

      case 'brand_logo':
        if (!client.website_url) {
          return NextResponse.json({ error: 'Client has no website URL' }, { status: 400 });
        }
        results = await analyzeBrand(client.website_url);
        break;

      case 'online_reviews': {
        const { data: items } = await supabase
          .from('report_items')
          .select('category')
          .eq('report_id', report_id)
          .order('sort_order', { ascending: true });
        const platforms = (items ?? []).map((i) => i.category);
        results = await analyzeReviews(client.name, client.address, platforms);
        break;
      }

      case 'competitors':
        results = await analyzeCompetitors(
          client.name,
          client.address,
          (client.industry as Industry) || null,
        );
        break;

      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 });
    }
  } catch (err) {
    console.error('Analysis failed:', err);
    return NextResponse.json(
      { error: 'Analysis failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }

  // Fetch existing report items
  const { data: existingItems } = await supabase
    .from('report_items')
    .select('id, category, sort_order, metadata')
    .eq('report_id', report_id)
    .order('sort_order', { ascending: true });

  if (!existingItems) {
    return NextResponse.json({ error: 'No report items found' }, { status: 404 });
  }

  // Update each item with analysis results
  let updatedCount = 0;
  for (const item of existingItems) {
    const result = results.find((r) => r.category === item.category);
    if (result && result.score !== null) {
      const catConfig = report_type === 'website'
        ? WEBSITE_CONFIG.categories.find((c) => c.category === item.category)
        : null;
      const maxScore = catConfig?.maxScore ?? (item.metadata as Record<string, unknown>)?.maxScore ?? 5;

      await supabase
        .from('report_items')
        .update({
          status: result.status,
          score: result.score,
          rating: (result.metadata?.rating as number) ?? null,
          total_reviews: (result.metadata?.total_reviews as number) ?? null,
          feedback_summary: result.feedback_summary,
          notes: result.notes,
          metadata: {
            maxScore,
            ...result.metadata,
          },
        })
        .eq('id', item.id);

      updatedCount++;
    }
  }

  // Cascade recalculation
  await recalculateReportScore(supabase, report_id);
  await recalculateReportSetScore(supabase, report.report_set_id);

  return NextResponse.json({
    updated: updatedCount,
    total: existingItems.length,
  });
}
