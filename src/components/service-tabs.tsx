'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TabBar } from '@bds/components/ui/TabBar/TabBar';

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Companies', value: 'companies' },
];

export function ServiceTabs({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  return (
    <TabBar
      variant="tab"
      items={tabs.map((t) => ({
        label: t.label,
        active: activeTab === t.value,
        onClick: () => {
          router.push(`/admin/services/${slug}?tab=${t.value}`);
        },
      }))}
    />
  );
}
