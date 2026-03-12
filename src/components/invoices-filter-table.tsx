'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
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
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (clientFilter && inv.company?.id !== clientFilter) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, clientFilter, statusFilter]);

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
              { id: 'open', label: 'Open' },
              { id: 'paid', label: 'Paid' },
              { id: 'void', label: 'Void' },
              { id: 'uncollectible', label: 'Uncollectible' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        rowKey={(inv) => inv.id}
        emptyMessage="No invoices match your filters"
        emptyDescription="Try adjusting your filters to see more results."
        columns={[
          {
            header: 'Client',
            accessor: (inv) =>
              inv.company ? (
                <a className="cell-link" href={`/admin/companies/${inv.company.slug}`}>
                  {inv.company.name}
                </a>
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
                    <Button variant="secondary" size="sm">View</Button>
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
