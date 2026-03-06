'use client';

import { useState, useMemo } from 'react';
import { Select } from '@bds/components/ui/Select/Select';

import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { ServiceBadge } from './service-badge';
import { ServiceTypeTag, CompanyStatusBadge } from './status-badges';
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
          gap: gap.sm,
          marginBottom: space.md,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.sm,
            color: color.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Showing {filtered.length} of {services.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All services"
            options={categoryOptions}
            size="sm"
            fullWidth={false}
          />
          <Select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            placeholder="All clients"
            options={clientOptions}
            size="sm"
            fullWidth={false}
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
            fullWidth={false}
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
      <DataTable
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage="No services match your filters."
          columns={[
            {
              header: '',
              accessor: (s) =>
                s.category ? <ServiceBadge category={s.category.slug} size={16} /> : null,
              style: { width: '32px', padding: `${space.xs} ${gap.xs} ${space.xs} ${space.sm}` },
            },
            {
              header: 'Service',
              accessor: (s) => s.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Category',
              accessor: (s) => s.category?.name ?? '—',
              style: { color: color.text.secondary },
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
              style: { color: color.text.secondary },
            },
            {
              header: 'Clients',
              accessor: (s) => s.client_count,
              style: { color: color.text.secondary },
            },
            {
              header: 'Status',
              accessor: (s) => (
                <CompanyStatusBadge status={s.active ? 'active' : 'inactive'} />
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
                      ? color.system.green
                      : color.border.secondary,
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
    </div>
  );
}
