/**
 * Score calculation, tier assignment, and cascading recalculation.
 *
 * Tiers:
 * - Pass: >= 70% of max score
 * - Fair: 40-69% of max score
 * - Fail: < 40% of max score
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ScoreTier = 'pass' | 'fair' | 'fail';

export function calculateTier(score: number, maxScore: number): ScoreTier {
  if (maxScore <= 0) return 'fail';
  const pct = score / maxScore;
  if (pct >= 0.7) return 'pass';
  if (pct >= 0.4) return 'fair';
  return 'fail';
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

export function tierLabel(tier: ScoreTier): string {
  switch (tier) {
    case 'pass': return 'Pass';
    case 'fair': return 'Fair';
    case 'fail': return 'Fail';
  }
}

/**
 * Recalculate a single report's score from its items, then update the row.
 * Works with both browser and server Supabase clients.
 */
export async function recalculateReportScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  reportId: string,
): Promise<void> {
  // Fetch all items for this report
  const { data: items } = await supabase
    .from('report_items')
    .select('score, status')
    .eq('report_id', reportId);

  if (!items || items.length === 0) return;

  // Fetch the report's max_score
  const { data: report } = await supabase
    .from('reports')
    .select('max_score')
    .eq('id', reportId)
    .single();

  if (!report) return;

  const maxScore = report.max_score ?? 0;
  const scoredItems = items.filter((i) => i.score !== null);
  const totalScore = scoredItems.reduce((sum, i) => sum + (i.score ?? 0), 0);
  const allScored = scoredItems.length === items.length;
  const noneScored = scoredItems.length === 0;

  // Determine report status
  let status: string;
  if (allScored) {
    status = 'completed';
  } else if (noneScored) {
    status = 'draft';
  } else {
    status = 'in_progress';
  }

  const score = noneScored ? null : totalScore;
  const tier = score !== null && maxScore > 0 ? calculateTier(score, maxScore) : null;

  await supabase
    .from('reports')
    .update({ score, tier, status })
    .eq('id', reportId);
}

/**
 * Recalculate a report set's overall score from all its reports, then update the row.
 * This fixes the bug where only completed reports' max_score was counted.
 */
export async function recalculateReportSetScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  reportSetId: string,
): Promise<void> {
  const { data: reports } = await supabase
    .from('reports')
    .select('score, max_score, status')
    .eq('report_set_id', reportSetId);

  if (!reports || reports.length === 0) return;

  // Sum ALL reports' max_score (not just completed ones — this is the fix)
  const overallMaxScore = reports.reduce((sum, r) => sum + (r.max_score ?? 0), 0);

  // Sum scores from reports that have scores
  const scoredReports = reports.filter((r) => r.score !== null);
  const overallScore = scoredReports.reduce((sum, r) => sum + (r.score ?? 0), 0);

  const allCompleted = reports.every((r) => r.status === 'completed');
  const overallTier = scoredReports.length > 0 && overallMaxScore > 0
    ? calculateTier(overallScore, overallMaxScore)
    : null;

  const setStatus = allCompleted ? 'completed' : 'needs_review';

  await supabase
    .from('report_sets')
    .update({
      overall_score: scoredReports.length > 0 ? overallScore : null,
      overall_max_score: overallMaxScore,
      overall_tier: overallTier,
      status: setStatus,
    })
    .eq('id', reportSetId);
}
