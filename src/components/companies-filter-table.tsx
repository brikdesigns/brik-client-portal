'use client';

import { useState, useMemo } from 'react';
import { Select } from '@bds/components/ui/Select/Select';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { DataTable } from './data-table';
import { CompanyStatusBadge, CompanyTypeTag } from './status-badges';

export interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  contact_email: string | null;
  contact_name: string | null;
  created_at: string;
}

const typeOptions = [
  { label: 'Lead', value: 'lead' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Client', value: 'client' },
];

const statusOptions = [
  { label: 'Not Started', value: 'not_started' },
  { label: 'Needs Qualified', value: 'needs_qualified' },
  { label: 'Needs Proposal', value: 'needs_proposal' },
  { label: 'Active', value: 'active' },
  { label: 'Not Active', value: 'not_active' },
];

export function CompaniesFilterTable({ companies }: { companies: CompanyRow[] }) {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [companies, typeFilter, statusFilter]);

  const hasFilters = typeFilter || statusFilter;

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
          Showing {filtered.length} of {companies.length}
        </span>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder="All types"
            options={typeOptions}
            size="sm"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={statusOptions}
            size="sm"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card variant="elevated" padding="lg">
        <DataTable
          data={filtered}
          rowKey={(c) => c.id}
          emptyMessage="No companies match your filters."
          columns={[
            {
              header: 'Company',
              accessor: (c) => c.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Type',
              accessor: (c) => <CompanyTypeTag type={c.type} muted={c.status === 'not_active'} />,
            },
            {
              header: 'Contact',
              accessor: (c) => c.contact_email || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (c) => <CompanyStatusBadge status={c.status} />,
            },
            {
              header: '',
              accessor: (c) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/companies/${c.slug}`}>
                  View
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
