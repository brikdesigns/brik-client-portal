'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';
import { formatIndustry } from '@/lib/format';
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
  industry: string | null;
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
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();

  const industryOptions = useMemo(() => {
    const unique = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean) as string[]));
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((i) => ({ label: formatIndustry(i), value: i }));
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (industryFilter && c.industry !== industryFilter) return false;
      return true;
    });
  }, [companies, typeFilter, statusFilter, industryFilter]);

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
          Showing {filtered.length} of {companies.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterButton
            size="sm"
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
          <FilterButton
            size="sm"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
          <FilterButton
            size="sm"
            label="Industry"
            value={industryFilter}
            onChange={setIndustryFilter}
            options={industryOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
        </div>
      </div>

      {/* Table */}
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
              style: { color: color.text.secondary },
            },
            {
              header: 'Industry',
              accessor: (c) => formatIndustry(c.industry),
              style: { color: color.text.secondary },
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
    </div>
  );
}
