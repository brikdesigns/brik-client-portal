'use client';

import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';
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
        emptyMessage="No line items."
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
                <p style={{ fontWeight: 500, color: 'var(--_color---text--primary)', margin: 0 }}>
                  {item.name}
                </p>
                {item.description && (
                  <p style={{ fontSize: '13px', color: 'var(--_color---text--muted)', margin: '4px 0 0' }}>
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
            style: { textAlign: 'right', color: 'var(--_color---text--secondary)' },
          },
          {
            header: 'Subtotal',
            accessor: (item) => formatCurrency(item.unit_price_cents * item.quantity),
            style: { textAlign: 'right', fontWeight: 500 },
          },
        ]}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: '16px',
          borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)',
          marginTop: '8px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--small, 18px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: 0,
          }}
        >
          Total: {formatCurrency(totalAmountCents)}
        </p>
      </div>
    </div>
  );
}
