import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { ReportingFilterTable, type ReportSetRow } from '@/components/reporting-filter-table';
import { space } from '@/lib/tokens';

export default async function AdminReportingPage() {
  const supabase = createClient();

  const { data: reportSets } = await supabase
    .from('report_sets')
    .select(`
      id, type, status, overall_score, overall_max_score, overall_tier, created_at,
      companies(id, name, slug, industry),
      reports(status)
    `)
    .order('created_at', { ascending: false });

  const all = (reportSets ?? []) as unknown as ReportSetRow[];
  const completed = all.filter((rs) => rs.status === 'completed').length;
  const needsReview = all.filter((rs) => rs.status === 'needs_review').length;

  return (
    <div>
      <PageHeader
        title="Reporting"
        subtitle="View marketing analysis reports across all clients."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: space.md,
          marginBottom: space.xl,
        }}
      >
        <CardSummary label="Total analyses" value={all.length} />
        <CardSummary label="Completed" value={completed} />
        <CardSummary label="Needs review" value={needsReview} />
      </div>

      <ReportingFilterTable reportSets={all} />
    </div>
  );
}
