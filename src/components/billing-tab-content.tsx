'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { InvoicesFilterTable, type InvoiceRow } from '@/components/invoices-filter-table';
import { AgreementsFilterTable, type AgreementRow } from '@/components/agreements-filter-table';
import { formatCurrency } from '@/lib/format';
import { font, color, gap, space, border } from '@/lib/tokens';

const tabs = [
  { label: 'Invoices', value: 'invoices' },
  { label: 'Agreements', value: 'agreements' },
];

const tabStyle = (active: boolean) => ({
  fontFamily: font.family.label,
  fontSize: font.size.body.md,
  fontWeight: font.weight.medium,
  color: active ? color.text.brand : color.text.muted,
  textDecoration: 'none' as const,
  padding: `${gap.sm} 0`,
  background: 'none',
  border: 'none',
  borderBottom: active
    ? `${border.width.lg} solid ${color.text.brand}`
    : `${border.width.lg} solid transparent`,
  marginBottom: `calc(-1 * ${border.width.md})`,
  cursor: 'pointer' as const,
});

interface Props {
  invoices: InvoiceRow[];
  agreements: AgreementRow[];
  clientOptions: { label: string; value: string }[];
}

export function BillingTabContent({ invoices, agreements, clientOptions }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') === 'agreements' ? 'agreements' : 'invoices';

  // Invoice stats
  const openInvoices = invoices.filter((i) => i.status === 'open');
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalOpen = openInvoices.reduce((sum, i) => sum + i.amount_cents, 0);

  // Agreement stats
  const pendingAgreements = agreements.filter((a) => a.status === 'sent' || a.status === 'viewed');
  const signedAgreements = agreements.filter((a) => a.status === 'signed');

  function switchTab(tab: string) {
    const url = tab === 'invoices' ? '/admin/invoices' : `/admin/invoices?tab=${tab}`;
    router.push(url, { scroll: false });
  }

  return (
    <>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: gap.xl,
          borderBottom: `${border.width.md} solid ${color.border.muted}`,
          marginBottom: '0',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.value}
            style={tabStyle(activeTab === t.value)}
            onClick={() => switchTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: space.md,
          marginTop: space.lg,
          marginBottom: space.lg,
        }}
      >
        {activeTab === 'invoices' ? (
          <>
            <CardSummary label="Open" value={`${openInvoices.length} (${formatCurrency(totalOpen)})`} />
            <CardSummary label="Paid" value={paidInvoices.length} />
            <CardSummary label="Total" value={invoices.length} />
          </>
        ) : (
          <>
            <CardSummary label="Pending" value={pendingAgreements.length} />
            <CardSummary label="Signed" value={signedAgreements.length} />
            <CardSummary label="Total" value={agreements.length} />
          </>
        )}
      </div>

      {activeTab === 'invoices' && (
        <InvoicesFilterTable invoices={invoices} clientOptions={clientOptions} />
      )}

      {activeTab === 'agreements' && (
        <AgreementsFilterTable agreements={agreements} clientOptions={clientOptions} />
      )}
    </>
  );
}
