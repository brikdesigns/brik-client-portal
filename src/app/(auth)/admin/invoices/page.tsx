import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { InvoiceStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';

export default async function AdminInvoicesPage() {
  const supabase = createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, description, amount_cents, currency, status,
      invoice_date, due_date, paid_at, invoice_url,
      clients(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const all = invoices ?? [];
  const openInvoices = all.filter((i) => i.status === 'open');
  const draftInvoices = all.filter((i) => i.status === 'draft');
  const paidInvoices = all.filter((i) => i.status === 'paid');
  const totalOpen = openInvoices.reduce((sum, i) => sum + i.amount_cents, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount_cents, 0);

  type InvoiceRow = (typeof all)[number];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${all.length} total invoices across all clients.`}
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Open" value={`${openInvoices.length} (${formatCurrency(totalOpen)})`} />
        <CardSummary label="Draft" value={draftInvoices.length} />
        <CardSummary label="Paid" value={`${paidInvoices.length} (${formatCurrency(totalPaid)})`} />
        <CardSummary label="Total invoices" value={all.length} />
      </div>

      {/* Open invoices */}
      {openInvoices.length > 0 && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: '0 0 16px',
            }}
          >
            Open invoices
          </h2>
          <DataTable<InvoiceRow>
            data={openInvoices}
            rowKey={(inv) => inv.id}
            emptyMessage=""
            columns={[
              {
                header: 'Client',
                accessor: (inv) => {
                  const client = inv.clients as unknown as { id: string; name: string; slug: string } | null;
                  return client ? (
                    <TextLink href={`/admin/clients/${client.slug}`} size="small">
                      {client.name}
                    </TextLink>
                  ) : '—';
                },
                style: { fontWeight: 500 },
              },
              {
                header: 'Description',
                accessor: (inv) => inv.description || 'Invoice',
                style: { color: 'var(--_color---text--primary)' },
              },
              {
                header: 'Amount',
                accessor: (inv) => formatCurrency(inv.amount_cents),
                style: { fontWeight: 600 },
              },
              {
                header: 'Due',
                accessor: (inv) =>
                  inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Status',
                accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
              },
              {
                header: '',
                accessor: (inv) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" size="sm" asLink href={`/admin/invoices/${inv.id}/edit`}>
                      Edit
                    </Button>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">
                          View Details
                        </Button>
                      </a>
                    )}
                  </div>
                ),
                style: { textAlign: 'right' },
              },
            ]}
          />
        </Card>
      )}

      {/* All invoices */}
      <Card variant="elevated" padding="lg">
        <h2
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 16px',
          }}
        >
          All invoices
        </h2>
        <DataTable<InvoiceRow>
          data={all}
          rowKey={(inv) => inv.id}
          emptyMessage="No invoices yet."
          columns={[
            {
              header: 'Client',
              accessor: (inv) => {
                const client = inv.clients as unknown as { id: string; name: string; slug: string } | null;
                return client ? (
                  <TextLink href={`/admin/clients/${client.slug}`} size="small">
                    {client.name}
                  </TextLink>
                ) : '—';
              },
              style: { fontWeight: 500 },
            },
            {
              header: 'Description',
              accessor: (inv) => inv.description || 'Invoice',
              style: { color: 'var(--_color---text--primary)' },
            },
            {
              header: 'Amount',
              accessor: (inv) => formatCurrency(inv.amount_cents),
              style: { fontWeight: 600 },
            },
            {
              header: 'Date',
              accessor: (inv) =>
                inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Due',
              accessor: (inv) =>
                inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
            },
            {
              header: '',
              accessor: (inv) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" asLink href={`/admin/invoices/${inv.id}/edit`}>
                    Edit
                  </Button>
                  {inv.invoice_url && (
                    <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </a>
                  )}
                </div>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
