import { createClient } from '@/lib/supabase/server';

import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProposalStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { font, color, gap, space } from '@/lib/tokens';

export default async function ProposalsPage() {
  const supabase = await createClient();

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
  const signed = allProposals.filter((p) => p.status === 'signed').length;

  return (
    <div>
      <PageHeader title="Proposals" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: gap.lg,
          marginBottom: space.lg,
        }}
      >
        <CardSummary label="Draft" value={draft} />
        <CardSummary label="Pending" value={sent} />
        <CardSummary label="Signed" value={signed} />
        <CardSummary label="Total" value={allProposals.length} />
      </div>

      <DataTable
          data={allProposals}
          rowKey={(p) => p.id}
          emptyMessage="No proposals yet"
          emptyDescription="Proposals are created from a company's detail page."
          emptyAction={{ label: 'View Companies', href: '/admin/companies' }}
          columns={[
            {
              header: 'Client',
              accessor: (p) => (
                <a
                  className="cell-link"
                  href={`/admin/companies/${p.companies.slug}`}
                  style={{ fontWeight: font.weight.medium }}
                >
                  {p.companies.name}
                </a>
              ),
            },
            {
              header: 'Title',
              accessor: (p) => (
                <a
                  className="cell-link"
                  href={`/admin/companies/${p.companies.slug}/proposals/${p.id}`}
                >
                  {p.title}
                </a>
              ),
            },
            {
              header: 'Total',
              accessor: (p) => formatCurrency(p.total_amount_cents),
              style: { color: color.text.secondary },
            },
            {
              header: 'Status',
              accessor: (p) => <ProposalStatusBadge status={p.status} />,
            },
            {
              header: 'Created',
              accessor: (p) => new Date(p.created_at).toLocaleDateString(),
              style: { color: color.text.muted },
            },
            {
              header: 'Valid Until',
              accessor: (p) => p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '—',
              style: { color: color.text.muted },
            },
          ]}
        />
    </div>
  );
}
