'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { font, color, gap, border } from '@/lib/tokens';

const tabs = [
  { label: 'Proposal', value: 'proposal' },
  { label: 'Signature', value: 'signature' },
];

export function ProposalTabs({ companySlug, proposalId }: { companySlug: string; proposalId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'proposal';

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
            router.push(`/admin/companies/${companySlug}/proposals/${proposalId}?tab=${t.value}`);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
