'use client';

import { useState, useMemo } from 'react';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
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
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return agreements.filter((a) => {
      if (clientFilter && a.company?.id !== clientFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [agreements, clientFilter, statusFilter]);

  const hasFilters = clientFilter || statusFilter;

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
              { label: 'Draft', value: 'draft' },
              { label: 'Sent', value: 'sent' },
              { label: 'Viewed', value: 'viewed' },
              { label: 'Signed', value: 'signed' },
              { label: 'Expired', value: 'expired' },
            ]}
            size="sm"
            fullWidth={false}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClientFilter('');
                setStatusFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={filtered}
        rowKey={(a) => a.id}
        emptyMessage="No agreements match your filters."
        columns={[
          {
            header: 'Client',
            accessor: (a) =>
              a.company ? (
                <TextLink href={`/admin/companies/${a.company.slug}`} size="small">
                  {a.company.name}
                </TextLink>
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
            accessor: (a) => <Tag>{typeLabel(a.type)}</Tag>,
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
