import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ReportStatusBadge } from '@/components/report-badges';
import { ScoreCard, NumericScoreCard } from '@/components/score-card';
import { OpportunitiesCard } from '@/components/opportunities-card';
import { EditableReportTable } from '@/components/editable-report-table';
import { AnalyzeButton } from '@/components/analyze-button';
import { REPORT_TYPE_LABELS, type ReportType } from '@/lib/analysis/report-config';
import { type ScoreTier } from '@/lib/analysis/scoring';
import { ReportDetailTabs } from './tabs';

interface Props {
  params: Promise<{ slug: string; reportType: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ReportDetailPage({ params, searchParams }: Props) {
  const { slug, reportType } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === 'details' ? 'details' : 'summary';

  const supabase = createClient();

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('companies')
    .select('id, name, slug, industry, website_url')
    .eq('slug', slug)
    .single();

  if (clientError || !client) notFound();

  // Fetch report set
  const { data: reportSet } = await supabase
    .from('report_sets')
    .select('id')
    .eq('company_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportSet) notFound();

  // Fetch the specific report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, report_type, status, score, max_score, tier, opportunities_text, created_at')
    .eq('report_set_id', reportSet.id)
    .eq('report_type', reportType)
    .single();

  if (reportError || !report) notFound();

  // Fetch report items
  const { data: items } = await supabase
    .from('report_items')
    .select('id, category, status, score, rating, total_reviews, feedback_summary, notes, metadata')
    .eq('report_id', report.id)
    .order('sort_order', { ascending: true });

  const allItems = (items ?? []) as Array<{
    id: string;
    category: string;
    status: string;
    score: number | null;
    rating: number | null;
    total_reviews: number | null;
    feedback_summary: string | null;
    notes: string | null;
    metadata: Record<string, unknown>;
  }>;
  const reportLabel = REPORT_TYPE_LABELS[reportType as ReportType] || reportType;

  // Count scored vs total items for progress display
  const scoredCount = allItems.filter((i) => i.score !== null).length;

  return (
    <div>
      <PageHeader
        title={reportLabel}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Reporting', href: '/admin/reporting' },
              { label: client.name, href: `/admin/reporting/${slug}` },
              { label: reportLabel },
            ]}
          />
        }
        metadata={[
          {
            label: 'Industry',
            value: client.industry
              ? client.industry.charAt(0).toUpperCase() + client.industry.slice(1).replace('-', ' ')
              : 'General',
          },
          {
            label: 'Status',
            value: <ReportStatusBadge status={report.status} />,
          },
          {
            label: 'Progress',
            value: `${scoredCount} of ${allItems.length} items scored`,
          },
        ]}
        actions={
          <AnalyzeButton
            reportId={report.id}
            reportType={reportType}
          />
        }
        tabs={
          <ReportDetailTabs
            slug={slug}
            reportType={reportType}
            activeTab={activeTab}
          />
        }
      />

      {activeTab === 'summary' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Score cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {report.tier && report.score !== null && report.max_score !== null ? (
              <ScoreCard
                tier={report.tier as ScoreTier}
                score={report.score}
                maxScore={report.max_score}
              />
            ) : (
              <NumericScoreCard value="—" label="Score pending" />
            )}
            <NumericScoreCard
              value={report.score !== null ? `${report.score} / ${report.max_score ?? '?'}` : '—'}
              label="Score"
            />
          </div>

          {/* Opportunities */}
          <OpportunitiesCard text={report.opportunities_text} />
        </div>
      ) : (
        <EditableReportTable
          items={allItems}
          reportId={report.id}
          reportSetId={reportSet.id}
          reportType={reportType as ReportType}
        />
      )}
    </div>
  );
}
