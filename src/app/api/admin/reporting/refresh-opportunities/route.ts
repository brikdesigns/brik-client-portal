import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { generateOpportunities } from '@/lib/analysis/seed-reports';
import { type WebsiteCheckResult } from '@/lib/analysis/website';

/**
 * POST /api/admin/reporting/refresh-opportunities
 * Regenerates opportunities_text for a report from its current items.
 * Called after manual score edits to keep opportunities in sync.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const { report_id } = await request.json() as { report_id: string };

  if (!report_id) {
    return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
  }

  // Fetch all items for this report
  const { data: items } = await supabase
    .from('report_items')
    .select('category, status, score, feedback_summary, notes, metadata')
    .eq('report_id', report_id)
    .order('sort_order', { ascending: true });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items found' }, { status: 404 });
  }

  // Map DB items to WebsiteCheckResult shape for generateOpportunities
  const results: WebsiteCheckResult[] = items.map((item) => ({
    category: item.category,
    status: (item.status ?? 'neutral') as WebsiteCheckResult['status'],
    score: item.score,
    feedback_summary: item.feedback_summary,
    notes: item.notes,
    metadata: (item.metadata as Record<string, unknown>) ?? {},
  }));

  const opportunitiesText = generateOpportunities(results);

  await supabase
    .from('reports')
    .update({ opportunities_text: opportunitiesText })
    .eq('id', report_id);

  return NextResponse.json({ ok: true });
}
