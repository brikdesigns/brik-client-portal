import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ReportSetStatusBadge } from '@/components/report-badges';

export default async function AdminReportingPage() {
  const supabase = createClient();

  const { data: reportSets } = await supabase
    .from('report_sets')
    .select(`
      id, status, overall_score, overall_max_score, overall_tier, created_at,
      clients(id, name, slug, industry)
    `)
    .order('created_at', { ascending: false });

  const all = reportSets ?? [];
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
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <CardSummary label="Total analyses" value={all.length} />
        <CardSummary label="Completed" value={completed} />
        <CardSummary label="Needs review" value={needsReview} />
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={all}
          rowKey={(rs) => rs.id}
          emptyMessage="No analyses yet. Start one from a prospect client page."
          columns={[
            {
              header: 'Client',
              accessor: (rs) => {
                const client = rs.clients as unknown as { id: string; name: string; slug: string; industry: string | null } | null;
                return client ? (
                  <a
                    href={`/admin/clients/${client.slug}`}
                    style={{ color: 'var(--_color---text--primary)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {client.name}
                  </a>
                ) : '—';
              },
            },
            {
              header: 'Status',
              accessor: (rs) => <ReportSetStatusBadge status={rs.status} />,
            },
            {
              header: 'Industry',
              accessor: (rs) => {
                const client = rs.clients as unknown as { industry: string | null } | null;
                return client?.industry
                  ? client.industry.charAt(0).toUpperCase() + client.industry.slice(1).replace('-', ' ')
                  : '—';
              },
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: 'Score',
              accessor: (rs) =>
                rs.overall_score !== null && rs.overall_max_score !== null
                  ? `${rs.overall_score} / ${rs.overall_max_score}`
                  : '—',
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: 'Created',
              accessor: (rs) => new Date(rs.created_at).toLocaleDateString(),
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: '',
              accessor: (rs) => {
                const client = rs.clients as unknown as { slug: string } | null;
                return client ? (
                  <Button variant="secondary" size="sm" asLink href={`/admin/reporting/${client.slug}`}>
                    View Details
                  </Button>
                ) : null;
              },
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
