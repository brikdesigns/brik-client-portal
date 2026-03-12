'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { AgreementStatusBadge } from './status-badges';

export interface AgreementRow {
  id: string;
  type: string;
  title: string;
  status: string;
  token: string;
  created_at: string;
  signed_at: string | null;
  signed_by_name: string | null;
  company: { id: string; name: string; slug: string } | null;
}

interface FilterOption {
  label: string;
  value: string;
}

const typeLabel = (type: string) => (type === 'baa' ? 'BAA' : 'Marketing');

export function AgreementsFilterTable({
  agreements,
  clientOptions,
}: {
  agreements: AgreementRow[];
  clientOptions: FilterOption[];
}) {
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return agreements.filter((a) => {
      if (clientFilter && a.company?.id !== clientFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [agreements, clientFilter, statusFilter]);

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
          Showing {filtered.length} of {agreements.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
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
              { id: 'draft', label: 'Draft' },
              { id: 'sent', label: 'Sent' },
              { id: 'viewed', label: 'Viewed' },
              { id: 'signed', label: 'Signed' },
              { id: 'expired', label: 'Expired' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        rowKey={(a) => a.id}
        emptyMessage="No agreements match your filters"
        emptyDescription="Try adjusting your filters to see more results."
        columns={[
          {
            header: 'Client',
            accessor: (a) =>
              a.company ? (
                <a className="cell-link" href={`/admin/companies/${a.company.slug}`}>
                  {a.company.name}
                </a>
              ) : (
                '—'
              ),
            style: { fontWeight: font.weight.medium },
          },
          {
            header: 'Title',
            accessor: (a) => a.title,
            style: { color: color.text.primary },
          },
          {
            header: 'Type',
            accessor: (a) => <Tag size="sm">{typeLabel(a.type)}</Tag>,
          },
          {
            header: 'Status',
            accessor: (a) => <AgreementStatusBadge status={a.status} />,
          },
          {
            header: 'Created',
            accessor: (a) => new Date(a.created_at).toLocaleDateString(),
            style: { color: color.text.secondary },
          },
          {
            header: 'Signed by',
            accessor: (a) => a.signed_by_name || '—',
            style: { color: color.text.secondary },
          },
          {
            header: '',
            accessor: (a) =>
              a.company ? (
                <Button
                  variant="secondary"
                  size="sm"
                  asLink
                  href={`/admin/companies/${a.company.slug}/agreements/${a.id}`}
                >
                  View
                </Button>
              ) : null,
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
