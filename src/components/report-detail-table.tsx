'use client';

import { Card } from '@bds/components/ui/Card/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bds/components/ui/Table/Table';
import { ItemStatusBadge } from '@/components/report-badges';
import { type ColumnConfig, getColumnConfig, type ReportType } from '@/lib/analysis/report-config';

interface ReportItem {
  id: string;
  category: string;
  status: string;
  score: number | null;
  rating: number | null;
  total_reviews: number | null;
  feedback_summary: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

interface ReportDetailTableProps {
  items: ReportItem[];
  reportType: ReportType;
}

function getValue(item: ReportItem, col: ColumnConfig): unknown {
  if (col.isMetadata) {
    return item.metadata?.[col.field] ?? null;
  }
  return (item as unknown as Record<string, unknown>)[col.field] ?? null;
}

function renderCell(item: ReportItem, col: ColumnConfig) {
  const val = getValue(item, col);

  if (col.field === 'status' && val) {
    return <ItemStatusBadge status={val as string} />;
  }

  if (val === null || val === undefined || val === '') return '—';
  return String(val);
}

export function ReportDetailTable({ items, reportType }: ReportDetailTableProps) {
  const columns = getColumnConfig(reportType);

  return (
    <Card variant="elevated" padding="lg">
      <h3
        style={{
          fontFamily: 'var(--_typography---font-family--heading)',
          fontSize: 'var(--_typography---heading--small)',
          fontWeight: 600,
          color: 'var(--_color---text--primary)',
          marginBottom: 'var(--_spacing---md)',
        }}
      >
        Audit details
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  style={{ textAlign: 'center', color: 'var(--_color---text--muted)' }}
                >
                  No items yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{renderCell(item, col)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
