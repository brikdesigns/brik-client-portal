'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { font, color, gap, border } from '@/lib/tokens';

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
  borderBottom: active ? `2px solid ${color.text.brand}` : '2px solid transparent',
  cursor: 'pointer' as const,
  background: 'none',
  border: 'none',
});

export function BillingTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'invoices';

  return (
    <div
      style={{
        display: 'flex',
        gap: gap.xl,
        borderBottom: `${border.width.lg} solid ${color.border.muted}`,
        marginBottom: '0',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          style={tabStyle(activeTab === t.value)}
          onClick={() => {
            const href = t.value
              ? `/admin/invoices?tab=${t.value}`
              : '/admin/invoices';
            router.push(href);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
