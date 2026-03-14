'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { Dot } from '@bds/components/ui/Dot/Dot';
import { ServiceBadge, ServiceCategoryLabel } from './service-badge';
import { ServiceTypeTag } from './status-badges';
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
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (categoryFilter && s.category?.id !== categoryFilter) return false;
      if (clientFilter && !s.clients.some((c) => c.id === clientFilter)) return false;
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      return true;
    });
  }, [services, categoryFilter, clientFilter, statusFilter]);

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
          <FilterButton
            size="sm"
            label="Service Line"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
          <FilterButton
            size="sm"
            label="Client"
            value={clientFilter}
            onChange={setClientFilter}
            options={clientOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
          <FilterButton
            size="sm"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Single unified table */}
      <DataTable
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage="No services match your filters"
          emptyDescription="Try adjusting your filters or add a new service."
          emptyAction={{ label: 'Add Service', href: '/admin/services/new' }}
          columns={[
            {
              header: '',
              accessor: (s) =>
                s.category ? <ServiceBadge category={s.category.slug} serviceName={s.name} size={28} /> : null,
              style: { width: '32px', padding: `${space.xs} ${gap.xs} ${space.xs} ${space.sm}` },
            },
            {
              header: 'Service',
              accessor: (s) => s.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Service Line',
              accessor: (s) => s.category?.slug
                ? <ServiceCategoryLabel category={s.category.slug} />
                : '—',
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
                <Dot status={s.active ? 'positive' : 'neutral'} size="sm" title={s.active ? 'Active' : 'Inactive'} />
              ),
            },
            {
              header: 'Stripe',
              accessor: (s) => (
                <Dot status={s.stripe_product_id ? 'positive' : 'neutral'} size="sm" title={s.stripe_product_id ? 'Linked to Stripe' : 'Not linked'} />
              ),
            },
            {
              header: '',
              accessor: (s) => (
                <LinkButton
                  variant="secondary"
                  size="sm"
                  href={`/admin/services/${s.slug}`}
                >
                  View
                </LinkButton>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
    </div>
  );
}
