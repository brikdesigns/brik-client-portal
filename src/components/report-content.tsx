'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { Meter, type MeterStatus } from '@bds/components/ui/Meter/Meter';
import { ReportDetailTable } from '@/components/report-detail-table';
import { EditableReportTable } from '@/components/editable-report-table';
import { type ReportType } from '@/lib/analysis/report-config';
import { type ScoreTier } from '@/lib/analysis/scoring';
import { font } from '@/lib/tokens';

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

const TIER_TO_STATUS: Record<ScoreTier, MeterStatus> = {
  pass: 'positive',
  fair: 'warning',
  fail: 'error',
};

const TIER_LABELS: Record<ScoreTier, string> = {
  pass: 'Pass',
  fair: 'Needs Attention',
  fail: 'Fail',
};

export function ReportContent({ report, items, reportType, reportSetId }: ReportContentProps) {
  const [editing, setEditing] = useState(false);

  const tier = report.tier as ScoreTier | null;
  const score = report.score ?? 0;
  const maxScore = report.max_score ?? 0;
  const meterStatus = tier ? TIER_TO_STATUS[tier] : 'neutral';
  const meterLabel = tier ? TIER_LABELS[tier] : 'Pending';

  const opportunityLines = report.opportunities_text
    ? report.opportunities_text
        .split(/\n+/)
        .map((line) => line.replace(/\*\*([^*]+)\*\*/g, '$1').trim())
        .filter(Boolean)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--_spacing---lg)' }}>
      {/* Summary row — 2-col on desktop, stacks on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) 2fr',
          gap: 'var(--_spacing---lg)',
        }}
      >
        {/* Meter card */}
        <Card variant="elevated" padding="lg">
          <Meter
            value={score}
            max={maxScore}
            status={meterStatus}
            label={meterLabel}
            size="lg"
          />
        </Card>

        {/* Opportunities card */}
        {opportunityLines.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <h3
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: 'var(--_typography---heading--small)',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: '0 0 16px',
              }}
            >
              Opportunities
            </h3>
            <ul
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: 'var(--_typography---body--md-base)',
                lineHeight: font.lineHeight.relaxed,
                color: 'var(--_color---text--secondary)',
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {opportunityLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg">
            <h3
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: 'var(--_typography---heading--small)',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: '0 0 16px',
              }}
            >
              Opportunities
            </h3>
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: 'var(--_typography---body--md-base)',
                color: 'var(--_color---text--muted)',
                margin: 0,
              }}
            >
              Run analysis to generate opportunities.
            </p>
          </Card>
        )}
      </div>

      {/* Audit details table */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 'var(--_spacing---sm)',
          }}
        >
          <Button
            variant={editing ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Done editing' : 'Edit'}
          </Button>
        </div>

        {editing ? (
          <EditableReportTable
            items={items}
            reportId={report.id}
            reportSetId={reportSetId}
            reportType={reportType}
          />
        ) : (
          <ReportDetailTable items={items} reportType={reportType} />
        )}
      </div>
    </div>
  );
}
