'use client';

import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';
import { text, heading } from '@/lib/styles';
import { color, font, space, gap } from '@/lib/tokens';
import type { FeeSummaryItem } from '@/lib/proposal-types';

interface FeeSummaryContentProps {
  items: FeeSummaryItem[];
  totalAmountCents: number;
}

export function FeeSummaryContent({ items, totalAmountCents }: FeeSummaryContentProps) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <DataTable
        data={sorted}
        rowKey={(item) => item.id}
        emptyMessage="No line items"
        emptyDescription="Add services to this proposal to see pricing."
        columns={[
          {
            header: '',
            accessor: (item) => (
              <ServiceBadge
                category={item.category_slug || 'brand'}
                serviceName={item.name}
                size={28}
              />
            ),
            style: { width: '44px', paddingRight: 0 },
          },
          {
            header: 'Service',
            accessor: (item) => (
              <div>
                <p style={{
                  ...text.body,
                  fontWeight: font.weight.medium,
                  margin: 0,
                }}>
                  {item.name}
                </p>
                {item.description && (
                  <p style={{
                    ...text.bodySmall,
                    color: color.text.muted,
                    margin: `${gap.xs} 0 0`,
                  }}>
                    {item.description}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: 'Qty',
            accessor: (item) => item.quantity,
            style: { width: '60px', textAlign: 'center' },
          },
          {
            header: 'Unit Price',
            accessor: (item) => formatCurrency(item.unit_price_cents),
            style: { textAlign: 'right', color: color.text.secondary },
          },
          {
            header: 'Subtotal',
            accessor: (item) => formatCurrency(item.unit_price_cents * item.quantity),
            style: { textAlign: 'right', fontWeight: font.weight.medium },
          },
        ]}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: space.md,
        }}
      >
        <p style={{ ...heading.section, margin: 0 }}>
          Total: {formatCurrency(totalAmountCents)}
        </p>
      </div>
    </div>
  );
}
