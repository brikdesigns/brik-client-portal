'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TabBar } from '@bds/components/ui/TabBar/TabBar';

const tabs = [
  { label: 'Invoices', value: 'invoices' },
  { label: 'Agreements', value: 'agreements' },
];

export function BillingTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'invoices';

  return (
    <TabBar
      variant="tab"
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
