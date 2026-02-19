import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type Industry } from '@/lib/analysis/report-config';
import { seedReports } from '@/lib/analysis/seed-reports';
import { calculateTier } from '@/lib/analysis/scoring';

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
  const { client_id } = body as { client_id: string };

  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
  }

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, slug, industry, website_url, address')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Check for existing report set
  const { data: existing } = await supabase
    .from('report_sets')
    .select('id')
    .eq('client_id', client_id)
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
    .insert({ client_id, status: 'in_progress' })
    .select('id')
    .single();

  if (rsError || !reportSet) {
    return NextResponse.json({ error: rsError?.message || 'Failed to create report set' }, { status: 500 });
  }

  // Seed reports + items
  const industry = (client.industry as Industry) || null;

  const result = await seedReports(
    reportSet.id,
    industry,
    client.website_url,
    async (report) => {
      const { data, error } = await supabase
        .from('reports')
        .insert(report)
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data.id;
    },
  );

  // Insert all items in batch
  if (result.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('report_items')
      .insert(result.items);
    if (itemsError) {
      console.error('Failed to insert report items:', itemsError);
    }
  }

  // Calculate overall score from completed reports
  const { data: completedReports } = await supabase
    .from('reports')
    .select('score, max_score, status')
    .eq('report_set_id', reportSet.id);

  const completed = completedReports?.filter((r) => r.status === 'completed') ?? [];
  const allDraft = completedReports?.every((r) => r.status === 'draft');

  if (completed.length > 0) {
    const overallScore = completed.reduce((sum, r) => sum + (r.score ?? 0), 0);
    const overallMaxScore = completed.reduce((sum, r) => sum + (r.max_score ?? 0), 0);
    const overallTier = calculateTier(overallScore, overallMaxScore);

    const hasAnyDraft = completedReports?.some((r) => r.status === 'draft');
    const setStatus = hasAnyDraft ? 'needs_review' : 'completed';

    await supabase
      .from('report_sets')
      .update({
        overall_score: overallScore,
        overall_max_score: overallMaxScore,
        overall_tier: overallTier,
        status: setStatus,
      })
      .eq('id', reportSet.id);
  } else if (allDraft) {
    await supabase
      .from('report_sets')
      .update({ status: 'needs_review' })
      .eq('id', reportSet.id);
  }

  return NextResponse.json({
    report_set_id: reportSet.id,
    slug: client.slug,
    reports_created: result.reports.length,
    items_created: result.items.length,
  });
}
