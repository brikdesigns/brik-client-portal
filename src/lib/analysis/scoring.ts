/**
 * Score calculation and tier assignment.
 *
 * Tiers:
 * - Pass: >= 70% of max score
 * - Fair: 40-69% of max score
 * - Fail: < 40% of max score
 */

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
