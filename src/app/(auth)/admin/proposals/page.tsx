import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProposalStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';

export default async function ProposalsPage() {
  const supabase = createClient();

  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      id, title, status, total_amount_cents, valid_until, created_at, token,
      companies(name, slug)
    `)
    .order('created_at', { ascending: false });

  const allProposals = (proposals as unknown as {
    id: string;
    title: string;
    status: string;
    total_amount_cents: number;
    valid_until: string | null;
    created_at: string;
    token: string;
    companies: { name: string; slug: string };
  }[]) ?? [];

  const draft = allProposals.filter((p) => p.status === 'draft').length;
  const sent = allProposals.filter((p) => p.status === 'sent' || p.status === 'viewed').length;
  const accepted = allProposals.filter((p) => p.status === 'accepted').length;

  return (
    <div>
      <PageHeader title="Proposals" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Draft" value={draft} />
        <CardSummary label="Pending" value={sent} />
        <CardSummary label="Accepted" value={accepted} />
        <CardSummary label="Total" value={allProposals.length} />
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={allProposals}
          rowKey={(p) => p.id}
          emptyMessage="No proposals yet."
          columns={[
            {
              header: 'Client',
              accessor: (p) => (
                <a
                  href={`/admin/companies/${p.companies.slug}`}
                  style={{ color: 'var(--_color---text--primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {p.companies.name}
                </a>
              ),
            },
            {
              header: 'Title',
              accessor: (p) => (
                <a
                  href={`/admin/companies/${p.companies.slug}/proposals/${p.id}`}
                  style={{ color: 'var(--_color---system--link)', textDecoration: 'none' }}
                >
                  {p.title}
                </a>
              ),
            },
            {
              header: 'Total',
              accessor: (p) => formatCurrency(p.total_amount_cents),
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (p) => <ProposalStatusBadge status={p.status} />,
            },
            {
              header: 'Created',
              accessor: (p) => new Date(p.created_at).toLocaleDateString(),
              style: { color: 'var(--_color---text--muted)', fontSize: '13px' },
            },
            {
              header: 'Valid Until',
              accessor: (p) => p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--muted)', fontSize: '13px' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
