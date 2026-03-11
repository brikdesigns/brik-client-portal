import type { CSSProperties, ReactNode } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bds/components/ui/Table/Table';
import { EmptyState } from './empty-state';

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  style?: CSSProperties;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  /** Empty state heading (required) */
  emptyMessage?: string;
  /** Optional supporting text below the heading */
  emptyDescription?: string;
  /** Optional CTA button */
  emptyAction?: { label: string; href: string };
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data yet.',
  emptyDescription,
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table size="default">
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={col.header || i}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col, i) => (
                <TableCell key={col.header || i} style={col.style}>
                  {col.accessor(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
