'use client';

import { EditableReportTable } from '@/components/editable-report-table';
import { type ReportType } from '@/lib/analysis/report-config';
import { type ScoreTier } from '@/lib/analysis/scoring';
import { ProgressBar } from '@bds/components/ui/ProgressBar/ProgressBar';
import { font, color, gap, border } from '@/lib/tokens';
import { heading as headingStyle } from '@/lib/styles';

interface ReportItem {
  id: string;
  category: string;
  status: string;
  score: number | null;
  rating: number | null;
  total_reviews: number | null;
  feedback_summary: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

interface ReportContentProps {
  report: {
    id: string;
    score: number | null;
    max_score: number | null;
    tier: string | null;
    opportunities_text: string | null;
  };
  items: ReportItem[];
  reportType: ReportType;
  reportSetId: string;
}

const TIER_LABELS: Record<ScoreTier, string> = {
  pass: 'Pass',
  fair: 'Needs Attention',
  fail: 'Fail',
};

const TIER_COLORS: Record<ScoreTier, string> = {
  pass: color.system.green,
  fair: color.system.yellow,
  fail: color.system.red,
};

export function ReportContent({ report, items, reportType, reportSetId }: ReportContentProps) {
  const tier = report.tier as ScoreTier | null;
  const score = report.score ?? 0;
  const maxScore = report.max_score ?? 0;
  const tierLabel = tier ? TIER_LABELS[tier] : 'Not Started';
  const tierColor = tier ? TIER_COLORS[tier] : color.text.muted;
  const progressPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const opportunitiesText = report.opportunities_text?.trim() || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
      {/* Summary row — 2-col on desktop, stacks on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) 2fr',
          gap: gap.lg,
        }}
      >
        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
          <ProgressBar
            value={progressPercent}
            label={`Score: ${score} of ${maxScore}`}
            fillColor={tierColor}
            style={{
              height: '40px',
              backgroundColor: color.background.secondary,
              borderRadius: border.radius.sm,
              border: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.bold, color: tierColor }}>
              {score} / {maxScore}
            </span>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.body.sm, fontWeight: font.weight.medium, color: tierColor }}>
              {tierLabel}
            </span>
          </div>
        </div>

        {/* Opportunities */}
        <div>
          <h3 style={headingStyle.section}>
            Opportunities
          </h3>
          <p
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.md,
              lineHeight: font.lineHeight.relaxed,
              color: opportunitiesText ? color.text.primary : color.text.muted,
              margin: 0,
            }}
          >
            {opportunitiesText || 'Run analysis to generate opportunities.'}
          </p>
        </div>
      </div>

      {/* Audit details table — inline edit per row */}
      <EditableReportTable
        items={items}
        reportId={report.id}
        reportSetId={reportSetId}
        reportType={reportType}
      />
    </div>
  );
}
