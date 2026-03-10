import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { ReportingFilterTable, type ReportSetRow } from '@/components/reporting-filter-table';
import { space } from '@/lib/tokens';

export default async function AdminReportingPage() {
  const supabase = await createClient();

  const { data: reportSets } = await supabase
    .from('report_sets')
    .select(`
      id, status, overall_score, overall_max_score, overall_tier, created_at,
      companies(id, name, slug, industry),
      reports(score)
    `)
    .order('created_at', { ascending: false });

  const all = (reportSets ?? []) as unknown as ReportSetRow[];
  const passing = all.filter((rs) => rs.overall_tier === 'pass').length;
  const needsAttention = all.filter((rs) => rs.overall_tier === 'fair' || rs.overall_tier === 'fail').length;

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
        <CardSummary label="Passing" value={passing} />
        <CardSummary label="Needs attention" value={needsAttention} />
      </div>

      <ReportingFilterTable reportSets={all} />
    </div>
  );
}
