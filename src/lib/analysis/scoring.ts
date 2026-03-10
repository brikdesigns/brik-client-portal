/**
 * Score calculation, tier assignment, and cascading recalculation.
 *
 * Tiers (these ARE the status now — no separate status field):
 * - Pass: >= 80% of max score
 * - Fair (Needs Attention): 40-79% of max score
 * - Fail: < 40% of max score
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ScoreTier = 'pass' | 'fair' | 'fail';

export function calculateTier(score: number, maxScore: number): ScoreTier {
  if (maxScore <= 0) return 'fail';
  const pct = score / maxScore;
  if (pct >= 0.8) return 'pass';
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
    case 'fair': return 'Needs Attention';
    case 'fail': return 'Fail';
  }
}

/**
 * Recalculate a single report's score and tier from its items.
 * Only items with a non-null score contribute to the total.
 * Tier is set as soon as any item is scored; null if no items scored.
 */
export async function recalculateReportScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  reportId: string,
): Promise<void> {
  const { data: items } = await supabase
    .from('report_items')
    .select('score')
    .eq('report_id', reportId);

  if (!items || items.length === 0) return;

  const { data: report } = await supabase
    .from('reports')
    .select('max_score')
    .eq('id', reportId)
    .single();

  if (!report) return;

  const maxScore = report.max_score ?? 0;
  const scoredItems = items.filter((i) => i.score !== null);
  const totalScore = scoredItems.reduce((sum, i) => sum + (i.score ?? 0), 0);
  const noneScored = scoredItems.length === 0;

  const score = noneScored ? null : totalScore;
  const tier = score !== null && maxScore > 0 ? calculateTier(score, maxScore) : null;

  await supabase
    .from('reports')
    .update({ score, tier })
    .eq('id', reportId);
}

/**
 * Recalculate a report set's overall score and tier from all its reports.
 * All reports' max_score counts toward the denominator (not just scored ones).
 */
export async function recalculateReportSetScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  reportSetId: string,
): Promise<void> {
  const { data: reports } = await supabase
    .from('reports')
    .select('score, max_score')
    .eq('report_set_id', reportSetId);

  if (!reports || reports.length === 0) return;

  const overallMaxScore = reports.reduce((sum, r) => sum + (r.max_score ?? 0), 0);
  const scoredReports = reports.filter((r) => r.score !== null);
  const overallScore = scoredReports.reduce((sum, r) => sum + (r.score ?? 0), 0);

  const overallTier = scoredReports.length > 0 && overallMaxScore > 0
    ? calculateTier(overallScore, overallMaxScore)
    : null;

  await supabase
    .from('report_sets')
    .update({
      overall_score: scoredReports.length > 0 ? overallScore : null,
      overall_max_score: overallMaxScore,
      overall_tier: overallTier,
    })
    .eq('id', reportSetId);
}
