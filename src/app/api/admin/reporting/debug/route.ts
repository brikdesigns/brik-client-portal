import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Temporary debug endpoint to diagnose empty report_items query.
 * DELETE after resolving the issue.
 *
 * GET /api/admin/reporting/debug?report_id=xxx
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not admin' }, { status: 403 });
  }

  const url = new URL(request.url);
  const reportId = url.searchParams.get('report_id');

  if (!reportId) {
    return NextResponse.json({ error: 'report_id query param required' }, { status: 400 });
  }

  // Test 1: report_items with full select (matches page query)
  const fullQuery = await supabase
    .from('report_items')
    .select('id, category, status, score, rating, total_reviews, feedback_summary, notes, metadata')
    .eq('report_id', reportId)
    .order('sort_order', { ascending: true });

  // Test 2: minimal select
  const minimalQuery = await supabase
    .from('report_items')
    .select('id, category')
    .eq('report_id', reportId);

  // Test 3: count only
  const countQuery = await supabase
    .from('report_items')
    .select('id', { count: 'exact', head: true })
    .eq('report_id', reportId);

  return NextResponse.json({
    user_id: user.id,
    user_role: profile?.role,
    report_id: reportId,
    full_query: {
      data_length: fullQuery.data?.length ?? null,
      error: fullQuery.error,
      first_item: fullQuery.data?.[0] ?? null,
    },
    minimal_query: {
      data_length: minimalQuery.data?.length ?? null,
      error: minimalQuery.error,
    },
    count_query: {
      count: countQuery.count,
      error: countQuery.error,
    },
  });
}
