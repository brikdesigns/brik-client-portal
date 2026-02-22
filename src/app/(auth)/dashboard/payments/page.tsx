import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { InvoiceStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { EmptyState } from '@/components/empty-state';
import { getCurrentClientId } from '@/lib/current-client';

export default async function PaymentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get current client from cookie
  const currentClientId = await getCurrentClientId(user!.id);

  // If no client selected, show empty state
  if (!currentClientId) {
    return (
      <div>
        <PageHeader title="Payments" subtitle="Select a client to view payments." />
        <Card variant="elevated" padding="lg">
          <EmptyState>No client selected. Use the client switcher above to select a client.</EmptyState>
        </Card>
      </div>
    );
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount_cents, currency, status, description, invoice_date, due_date, paid_at, invoice_url')
    .eq('company_id', currentClientId)
    .order('invoice_date', { ascending: false });

  const openInvoices = invoices?.filter((i) => i.status === 'open') ?? [];
  const paidInvoices = invoices?.filter((i) => i.status === 'paid') ?? [];
  const totalDue = openInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);

  const subtitle = totalDue > 0
    ? `You have ${openInvoices.length} open invoice${openInvoices.length !== 1 ? 's' : ''} totaling ${formatCurrency(totalDue)}.`
    : 'All invoices are up to date.';

  return (
    <div>
      <PageHeader title="Payments" subtitle={subtitle} />

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <CardSummary label="Amount due" value={formatCurrency(totalDue)} />
        <CardSummary label="Open invoices" value={openInvoices.length} />
        <CardSummary label="Paid" value={`${paidInvoices.length} (${formatCurrency(totalPaid)})`} />
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={invoices ?? []}
          rowKey={(inv) => inv.id}
          emptyMessage="No invoices yet."
          columns={[
            {
              header: 'Description',
              accessor: (inv) => inv.description || 'Invoice',
              style: { color: 'var(--_color---text--primary)', fontWeight: 500 },
            },
            {
              header: 'Date',
              accessor: (inv) =>
                inv.invoice_date
                  ? new Date(inv.invoice_date).toLocaleDateString()
                  : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Due',
              accessor: (inv) =>
                inv.due_date
                  ? new Date(inv.due_date).toLocaleDateString()
                  : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Amount',
              accessor: (inv) => formatCurrency(inv.amount_cents),
              style: { color: 'var(--_color---text--primary)', fontWeight: 600 },
            },
            {
              header: 'Status',
              accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
            },
            {
              header: '',
              accessor: (inv) =>
                inv.invoice_url ? (
                  <a
                    href={inv.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--_color---system--link, #0034ea)',
                      fontFamily: 'var(--_typography---font-family--body)',
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    View
                  </a>
                ) : null,
            },
          ]}
        />
      </Card>
    </div>
  );
}
