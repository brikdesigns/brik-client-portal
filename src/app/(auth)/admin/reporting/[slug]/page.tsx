import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ReportStatusBadge, ScoreTierBadge } from '@/components/report-badges';
import { REPORT_TYPE_LABELS, type ReportType } from '@/lib/analysis/report-config';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClientReportListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  // Fetch client
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, slug, industry')
    .eq('slug', slug)
    .single();

  if (error || !client) notFound();

  // Fetch report set for this client
  const { data: reportSet } = await supabase
    .from('report_sets')
    .select('id, status, overall_score, overall_max_score, overall_tier')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportSet) notFound();

  // Fetch reports in this set
  const { data: reports } = await supabase
    .from('reports')
    .select('id, report_type, status, score, max_score, tier, created_at')
    .eq('report_set_id', reportSet.id)
    .order('created_at', { ascending: true });

  const allReports = reports ?? [];
  const completedCount = allReports.filter((r) => r.status === 'completed').length;
  const totalCount = allReports.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle="Marketing analysis reports"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Reporting', href: '/admin/reporting' },
              { label: client.name },
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
            label: 'Progress',
            value: `${completedCount} of ${totalCount} reports complete`,
          },
          {
            label: 'Overall tier',
            value: allComplete && reportSet.overall_tier
              ? <ScoreTierBadge tier={reportSet.overall_tier} />
              : 'In progress',
          },
        ]}
      />

      <Card variant="elevated" padding="lg">
        <DataTable
          data={allReports}
          rowKey={(r) => r.id}
          emptyMessage="No reports generated yet."
          columns={[
            {
              header: 'Report',
              accessor: (r) => (
                <a
                  href={`/admin/reporting/${slug}/${r.report_type}`}
                  style={{ color: 'var(--_color---text--primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {REPORT_TYPE_LABELS[r.report_type as ReportType] || r.report_type}
                </a>
              ),
            },
            {
              header: 'Status',
              accessor: (r) => <ReportStatusBadge status={r.status} />,
            },
            {
              header: 'Tier',
              accessor: (r) => r.tier ? <ScoreTierBadge tier={r.tier} /> : '—',
            },
            {
              header: 'Score',
              accessor: (r) =>
                r.score !== null && r.max_score !== null
                  ? `${r.score} / ${r.max_score}`
                  : '—',
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: '',
              accessor: (r) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/reporting/${slug}/${r.report_type}`}>
                  View Details
                </Button>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
