import { createClient } from '@/lib/supabase/server';

import { PageHeader } from '@/components/page-header';
import { BillingTabContent } from '@/components/billing-tab-content';
import type { InvoiceRow } from '@/components/invoices-filter-table';
import type { AgreementRow } from '@/components/agreements-filter-table';

export default async function AdminInvoicesPage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: agreements }] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        id, description, amount_cents, currency, status,
        invoice_date, due_date, paid_at, invoice_url,
        companies(id, name, slug)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('agreements')
      .select(`
        id, type, title, status, token, created_at,
        signed_at, signed_by_name,
        companies(id, name, slug)
      `)
      .order('created_at', { ascending: false }),
  ]);

  const invoiceRows: InvoiceRow[] = (invoices ?? []).map((inv) => ({
    ...inv,
    company: inv.companies as unknown as { id: string; name: string; slug: string } | null,
  }));

  const agreementRows: AgreementRow[] = (agreements ?? []).map((a) => ({
    ...a,
    company: a.companies as unknown as { id: string; name: string; slug: string } | null,
  }));

  // Build client filter options from both
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
      <PageHeader title="Billing" />
      <BillingTabContent
        invoices={invoiceRows}
        agreements={agreementRows}
        clientOptions={clientOptions}
      />
    </div>
  );
}
