'use client';

import { useState, useMemo } from 'react';
import { Select } from '@bds/components/ui/Select/Select';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { DataTable } from './data-table';
import { ServiceBadge } from './service-badge';
import { ServiceTypeTag, ClientStatusBadge } from './status-badges';
import { formatCurrency } from '@/lib/format';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

interface ClientInfo {
  id: string;
  name: string;
}

export interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  service_type: string;
  billing_frequency: string;
  base_price_cents: number | null;
  active: boolean;
  stripe_product_id: string | null;
  category: ServiceCategory | null;
  clients: ClientInfo[];
  client_count: number;
}

interface FilterOption {
  label: string;
  value: string;
}

export function ServicesFilterTable({
  services,
  categoryOptions,
  clientOptions,
}: {
  services: ServiceRow[];
  categoryOptions: FilterOption[];
  clientOptions: FilterOption[];
}) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (categoryFilter && s.category?.id !== categoryFilter) return false;
      if (clientFilter && !s.clients.some((c) => c.id === clientFilter)) return false;
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      return true;
    });
  }, [services, categoryFilter, clientFilter, statusFilter]);

  const hasFilters = categoryFilter || clientFilter || statusFilter;

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--sm)',
            color: 'var(--_color---text--secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          Showing {filtered.length} of {services.length}
        </span>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All services"
            options={categoryOptions}
            size="sm"
          />
          <Select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            placeholder="All clients"
            options={clientOptions}
            size="sm"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
            size="sm"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter('');
                setClientFilter('');
                setStatusFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Single unified table */}
      <Card variant="elevated" padding="lg">
        <DataTable
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage="No services match your filters."
          columns={[
            {
              header: '',
              accessor: (s) =>
                s.category ? <ServiceBadge category={s.category.slug} size={16} /> : null,
              style: { width: '32px', padding: '10px 4px 10px 12px' },
            },
            {
              header: 'Service',
              accessor: (s) => s.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Category',
              accessor: (s) => s.category?.name ?? '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Type',
              accessor: (s) => <ServiceTypeTag type={s.service_type} />,
            },
            {
              header: 'Price',
              accessor: (s) =>
                s.base_price_cents
                  ? `${formatCurrency(s.base_price_cents)}${s.billing_frequency === 'monthly' ? '/mo' : ''}`
                  : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Clients',
              accessor: (s) => s.client_count,
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (s) => (
                <ClientStatusBadge status={s.active ? 'active' : 'inactive'} />
              ),
            },
            {
              header: 'Stripe',
              accessor: (s) => (
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: s.stripe_product_id
                      ? 'var(--services--green-dark, #4caf50)'
                      : 'var(--_color---border--secondary)',
                  }}
                  title={s.stripe_product_id ? 'Linked to Stripe' : 'Not linked'}
                />
              ),
            },
            {
              header: '',
              accessor: (s) => (
                <Button
                  variant="secondary"
                  size="sm"
                  asLink
                  href={`/admin/services/${s.slug}`}
                >
                  View Details
                </Button>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
