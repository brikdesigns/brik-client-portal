'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { font, color, gap, border } from '@/lib/tokens';

const tabs = [
  { label: 'All', value: '' },
  { label: 'Leads', value: 'lead' },
  { label: 'Prospects', value: 'prospect' },
  { label: 'Clients', value: 'client' },
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
  borderBottom: active ? `${border.width.lg} solid ${color.text.brand}` : `${border.width.lg} solid transparent`,
  marginBottom: `calc(-1 * ${border.width.lg})`,
  cursor: 'pointer' as const,
});

export function CompanyTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type') ?? '';

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
          style={tabStyle(activeType === t.value)}
          onClick={() => {
            const href = t.value
              ? `/admin/companies?type=${t.value}`
              : '/admin/companies';
            router.push(href);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
