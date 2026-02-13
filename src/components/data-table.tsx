import type { CSSProperties, ReactNode } from 'react';
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
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '14px',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid var(--_color---border--secondary, #e0e0e0)',
  color: 'var(--_color---text--secondary)',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdBaseStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--_color---border--secondary, #e0e0e0)',
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data yet.',
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} style={thStyle}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <td key={col.header} style={{ ...tdBaseStyle, ...col.style }}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
