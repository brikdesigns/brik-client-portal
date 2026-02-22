'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TabBar } from '@bds/components/ui/TabBar/TabBar';

const tabs = [
  { label: 'All', value: '' },
  { label: 'Invoices', value: 'invoices' },
  { label: 'Agreements', value: 'agreements' },
];

export function BillingTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? '';

  return (
    <TabBar
      items={tabs.map((t) => ({
        label: t.label,
        active: activeTab === t.value,
        onClick: () => {
          const href = t.value
            ? `/admin/invoices?tab=${t.value}`
            : '/admin/invoices';
          router.push(href);
        },
      }))}
    />
  );
}
