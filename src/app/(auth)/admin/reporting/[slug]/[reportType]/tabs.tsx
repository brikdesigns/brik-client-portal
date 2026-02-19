'use client';

import { useRouter } from 'next/navigation';
import { TabBar } from '@bds/components/ui/TabBar/TabBar';

interface ReportDetailTabsProps {
  slug: string;
  reportType: string;
  activeTab: string;
}

export function ReportDetailTabs({ slug, reportType, activeTab }: ReportDetailTabsProps) {
  const router = useRouter();

  return (
    <TabBar
      items={[
        {
          label: 'Summary',
          active: activeTab === 'summary',
          onClick: () => router.push(`/admin/reporting/${slug}/${reportType}?tab=summary`),
        },
        {
          label: 'Details',
          active: activeTab === 'details',
          onClick: () => router.push(`/admin/reporting/${slug}/${reportType}?tab=details`),
        },
      ]}
    />
  );
}
