'use client';

import { useState, useMemo } from 'react';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { InvoiceStatusBadge } from './status-badges';
import { formatCurrency } from '@/lib/format';

export interface InvoiceRow {
  id: string;
  description: string | null;
  amount_cents: number;
  currency: string | null;
  status: string;
  invoice_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  company: { id: string; name: string; slug: string } | null;
}

interface FilterOption {
  label: string;
  value: string;
}

export function InvoicesFilterTable({
  invoices,
  clientOptions,
}: {
  invoices: InvoiceRow[];
  clientOptions: FilterOption[];
}) {
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (clientFilter && inv.company?.id !== clientFilter) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, clientFilter, statusFilter]);

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
          Showing {filtered.length} of {invoices.length}
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
              { label: 'Open', value: 'open' },
              { label: 'Paid', value: 'paid' },
              { label: 'Void', value: 'void' },
              { label: 'Uncollectible', value: 'uncollectible' },
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
        rowKey={(inv) => inv.id}
        emptyMessage="No invoices match your filters."
        columns={[
          {
            header: 'Client',
            accessor: (inv) =>
              inv.company ? (
                <TextLink href={`/admin/companies/${inv.company.slug}`} size="small">
                  {inv.company.name}
                </TextLink>
              ) : (
                '—'
              ),
            style: { fontWeight: font.weight.medium },
          },
          {
            header: 'Description',
            accessor: (inv) => inv.description || 'Invoice',
            style: { color: color.text.primary },
          },
          {
            header: 'Amount',
            accessor: (inv) => formatCurrency(inv.amount_cents),
            style: { fontWeight: font.weight.semibold },
          },
          {
            header: 'Date',
            accessor: (inv) =>
              inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'Due',
            accessor: (inv) =>
              inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'Status',
            accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
          },
          {
            header: '',
            accessor: (inv) => (
              <div style={{ display: 'flex', gap: gap.sm, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" asLink href={`/admin/invoices/${inv.id}/edit`}>
                  Edit
                </Button>
                {inv.invoice_url && (
                  <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">View Details</Button>
                  </a>
                )}
              </div>
            ),
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
