import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { InvoiceStatusBadge, AgreementStatusBadge } from '@/components/status-badges';
import { BillingTabs } from '@/components/billing-tabs';
import { formatCurrency } from '@/lib/format';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const { tab: tabFilter } = await searchParams;
  const supabase = createClient();

  // Always fetch both for accurate stats
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, description, amount_cents, currency, status,
      invoice_date, due_date, paid_at, invoice_url,
      companies(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const { data: agreements } = await supabase
    .from('agreements')
    .select(`
      id, type, title, status, token, created_at,
      signed_at, signed_by_name,
      companies(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const allInvoices = invoices ?? [];
  const allAgreements = agreements ?? [];

  // Invoice stats
  const openInvoices = allInvoices.filter((i) => i.status === 'open');
  const paidInvoices = allInvoices.filter((i) => i.status === 'paid');
  const totalOpen = openInvoices.reduce((sum, i) => sum + i.amount_cents, 0);

  // Agreement stats
  const pendingAgreements = allAgreements.filter((a) => a.status === 'sent' || a.status === 'viewed');
  const signedAgreements = allAgreements.filter((a) => a.status === 'signed');

  const showInvoices = !tabFilter || tabFilter === 'invoices';
  const showAgreements = !tabFilter || tabFilter === 'agreements';

  type InvoiceRow = (typeof allInvoices)[number];
  type AgreementRow = (typeof allAgreements)[number];

  const typeLabel = (type: string) =>
    type === 'baa' ? 'BAA' : 'Marketing';

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${allInvoices.length} invoices, ${allAgreements.length} agreements across all clients.`}
        tabs={<BillingTabs />}
      />

      {/* Stats — always visible */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Open Invoices" value={`${openInvoices.length} (${formatCurrency(totalOpen)})`} />
        <CardSummary label="Paid" value={paidInvoices.length} />
        <CardSummary label="Pending Agreements" value={pendingAgreements.length} />
        <CardSummary label="Signed" value={signedAgreements.length} />
      </div>

      {/* Invoices section */}
      {showInvoices && (
        <>
          {/* Open invoices */}
          {openInvoices.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={sectionHeadingStyle}>Open invoices</h2>
              <DataTable<InvoiceRow>
                data={openInvoices}
                rowKey={(inv) => inv.id}
                emptyMessage=""
                columns={[
                  {
                    header: 'Client',
                    accessor: (inv) => {
                      const client = inv.companies as unknown as { id: string; name: string; slug: string } | null;
                      return client ? (
                        <TextLink href={`/admin/companies/${client.slug}`} size="small">
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
                            <Button variant="secondary" size="sm">View Details</Button>
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
          <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
            <h2 style={sectionHeadingStyle}>All invoices</h2>
            <DataTable<InvoiceRow>
              data={allInvoices}
              rowKey={(inv) => inv.id}
              emptyMessage="No invoices yet."
              columns={[
                {
                  header: 'Client',
                  accessor: (inv) => {
                    const client = inv.companies as unknown as { id: string; name: string; slug: string } | null;
                    return client ? (
                      <TextLink href={`/admin/companies/${client.slug}`} size="small">
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
                          <Button variant="primary" size="sm">View Details</Button>
                        </a>
                      )}
                    </div>
                  ),
                  style: { textAlign: 'right' },
                },
              ]}
            />
          </Card>
        </>
      )}

      {/* Agreements section */}
      {showAgreements && (
        <>
          {/* Pending agreements */}
          {pendingAgreements.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={sectionHeadingStyle}>Pending signature</h2>
              <DataTable<AgreementRow>
                data={pendingAgreements}
                rowKey={(a) => a.id}
                emptyMessage=""
                columns={[
                  {
                    header: 'Client',
                    accessor: (a) => {
                      const client = a.companies as unknown as { id: string; name: string; slug: string } | null;
                      return client ? (
                        <TextLink href={`/admin/companies/${client.slug}`} size="small">
                          {client.name}
                        </TextLink>
                      ) : '—';
                    },
                    style: { fontWeight: 500 },
                  },
                  {
                    header: 'Title',
                    accessor: (a) => a.title,
                    style: { color: 'var(--_color---text--primary)' },
                  },
                  {
                    header: 'Type',
                    accessor: (a) => <Tag>{typeLabel(a.type)}</Tag>,
                  },
                  {
                    header: 'Status',
                    accessor: (a) => <AgreementStatusBadge status={a.status} />,
                  },
                  {
                    header: 'Created',
                    accessor: (a) => new Date(a.created_at).toLocaleDateString(),
                    style: { color: 'var(--_color---text--secondary)' },
                  },
                  {
                    header: '',
                    accessor: (a) => {
                      const client = a.companies as unknown as { slug: string } | null;
                      return client ? (
                        <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${a.id}`}>
                          View
                        </Button>
                      ) : null;
                    },
                    style: { textAlign: 'right' },
                  },
                ]}
              />
            </Card>
          )}

          {/* All agreements */}
          <Card variant="elevated" padding="lg">
            <h2 style={sectionHeadingStyle}>All agreements</h2>
            <DataTable<AgreementRow>
              data={allAgreements}
              rowKey={(a) => a.id}
              emptyMessage="No agreements yet."
              columns={[
                {
                  header: 'Client',
                  accessor: (a) => {
                    const client = a.companies as unknown as { id: string; name: string; slug: string } | null;
                    return client ? (
                      <TextLink href={`/admin/companies/${client.slug}`} size="small">
                        {client.name}
                      </TextLink>
                    ) : '—';
                  },
                  style: { fontWeight: 500 },
                },
                {
                  header: 'Title',
                  accessor: (a) => a.title,
                  style: { color: 'var(--_color---text--primary)' },
                },
                {
                  header: 'Type',
                  accessor: (a) => <Tag>{typeLabel(a.type)}</Tag>,
                },
                {
                  header: 'Status',
                  accessor: (a) => <AgreementStatusBadge status={a.status} />,
                },
                {
                  header: 'Created',
                  accessor: (a) => new Date(a.created_at).toLocaleDateString(),
                  style: { color: 'var(--_color---text--secondary)' },
                },
                {
                  header: 'Signed by',
                  accessor: (a) => a.signed_by_name || '—',
                  style: { color: 'var(--_color---text--secondary)' },
                },
                {
                  header: '',
                  accessor: (a) => {
                    const client = a.companies as unknown as { slug: string } | null;
                    return client ? (
                      <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${a.id}`}>
                        View
                      </Button>
                    ) : null;
                  },
                  style: { textAlign: 'right' },
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
