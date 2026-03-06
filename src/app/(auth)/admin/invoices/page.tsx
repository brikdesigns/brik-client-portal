import { createClient } from '@/lib/supabase/server';

import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { BillingTabs } from '@/components/billing-tabs';
import { InvoicesFilterTable, type InvoiceRow } from '@/components/invoices-filter-table';
import { AgreementsFilterTable, type AgreementRow } from '@/components/agreements-filter-table';
import { formatCurrency } from '@/lib/format';
import { space } from '@/lib/tokens';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const { tab: tabFilter } = await searchParams;
  const supabase = createClient();

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

  // Transform for client components
  const invoiceRows: InvoiceRow[] = allInvoices.map((inv) => ({
    ...inv,
    company: inv.companies as unknown as { id: string; name: string; slug: string } | null,
  }));

  const agreementRows: AgreementRow[] = allAgreements.map((a) => ({
    ...a,
    company: a.companies as unknown as { id: string; name: string; slug: string } | null,
  }));

  // Build client filter options from both invoices and agreements
  const clientMap = new Map<string, string>();
  invoiceRows.forEach((inv) => {
    if (inv.company) clientMap.set(inv.company.id, inv.company.name);
  });
  agreementRows.forEach((a) => {
    if (a.company) clientMap.set(a.company.id, a.company.name);
  });
  const clientOptions = Array.from(clientMap.entries())
    .map(([id, name]) => ({ label: name, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${allInvoices.length} invoices, ${allAgreements.length} agreements across all clients.`}
        tabs={<BillingTabs />}
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: space.md,
          marginBottom: space.lg,
        }}
      >
        <CardSummary label="Open Invoices" value={`${openInvoices.length} (${formatCurrency(totalOpen)})`} />
        <CardSummary label="Paid" value={paidInvoices.length} />
        <CardSummary label="Pending Agreements" value={pendingAgreements.length} />
        <CardSummary label="Signed" value={signedAgreements.length} />
      </div>

      {showInvoices && (
        <InvoicesFilterTable invoices={invoiceRows} clientOptions={clientOptions} />
      )}

      {showAgreements && (
        <AgreementsFilterTable agreements={agreementRows} clientOptions={clientOptions} />
      )}
    </div>
  );
}
