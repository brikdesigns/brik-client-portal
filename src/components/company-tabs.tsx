'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TabBar } from '@bds/components/ui/TabBar/TabBar';

const tabs = [
  { label: 'All', value: '' },
  { label: 'Leads', value: 'lead' },
  { label: 'Prospects', value: 'prospect' },
  { label: 'Clients', value: 'client' },
];

export function CompanyTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type') ?? '';

  return (
    <TabBar
      items={tabs.map((t) => ({
        label: t.label,
        active: activeType === t.value,
        onClick: () => {
          const href = t.value
            ? `/admin/companies?type=${t.value}`
            : '/admin/companies';
          router.push(href);
        },
      }))}
    />
  );
}
