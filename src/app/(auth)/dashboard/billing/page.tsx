import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { InvoiceStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount_cents, currency, status, description, invoice_date, due_date, paid_at, invoice_url')
    .order('invoice_date', { ascending: false });

  const openInvoices = invoices?.filter((i) => i.status === 'open') ?? [];
  const totalDue = openInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);

  const subtitle = totalDue > 0
    ? `You have ${openInvoices.length} open invoice${openInvoices.length !== 1 ? 's' : ''} totaling ${formatCurrency(totalDue)}.`
    : 'All invoices are up to date.';

  return (
    <div>
      <PageHeader title="Billing" subtitle={subtitle} />

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
