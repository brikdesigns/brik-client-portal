'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { ItemStatusBadge } from '@/components/report-badges';
import { type ColumnConfig, getColumnConfig, type ReportType } from '@/lib/analysis/report-config';
import { recalculateReportScore, recalculateReportSetScore } from '@/lib/analysis/scoring';

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

interface EditableReportTableProps {
  items: ReportItem[];
  reportId: string;
  reportSetId: string;
  reportType: ReportType;
}

export function EditableReportTable({
  items,
  reportId,
  reportSetId,
  reportType,
}: EditableReportTableProps) {
  const router = useRouter();
  const columns = getColumnConfig(reportType);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback((item: ReportItem) => {
    const values: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.readOnly) continue;
      if (col.isMetadata) {
        values[col.field] = item.metadata?.[col.field] ?? '';
      } else {
        values[col.field] = (item as unknown as Record<string, unknown>)[col.field] ?? '';
      }
    }
    setEditValues(values);
    setEditingId(item.id);
  }, [columns]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const saveEdit = useCallback(async (item: ReportItem) => {
    setSaving(true);
    try {
      const supabase = createClient();

      // Build update payload — separate base fields from metadata
      const baseUpdate: Record<string, unknown> = {};
      const metadataUpdate = { ...(item.metadata ?? {}) };

      for (const col of columns) {
        if (col.readOnly) continue;
        const val = editValues[col.field];
        if (col.isMetadata) {
          metadataUpdate[col.field] = val === '' ? null : val;
        } else {
          if (col.inputType === 'number') {
            baseUpdate[col.field] = val === '' || val === null ? null : Number(val);
          } else {
            baseUpdate[col.field] = val === '' ? null : val;
          }
        }
      }

      baseUpdate.metadata = metadataUpdate;

      await supabase
        .from('report_items')
        .update(baseUpdate)
        .eq('id', item.id);

      // Cascade recalculation
      await recalculateReportScore(supabase, reportId);
      await recalculateReportSetScore(supabase, reportSetId);

      setEditingId(null);
      setEditValues({});
      router.refresh();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [columns, editValues, reportId, reportSetId, router]);

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

  function renderEditCell(col: ColumnConfig) {
    const val = editValues[col.field] ?? '';

    if (col.inputType === 'select' && col.options) {
      return (
        <Select
          size="sm"
          value={String(val)}
          options={col.options}
          placeholder="—"
          onChange={(e) => setEditValues((prev) => ({ ...prev, [col.field]: e.target.value }))}
        />
      );
    }

    if (col.inputType === 'textarea') {
      return (
        <TextArea
          rows={2}
          value={String(val)}
          onChange={(e) => setEditValues((prev) => ({ ...prev, [col.field]: e.target.value }))}
          style={{ minWidth: '120px', fontSize: '13px' }}
        />
      );
    }

    if (col.inputType === 'number') {
      return (
        <TextInput
          size="sm"
          type="number"
          value={val === null ? '' : String(val)}
          min={col.min}
          max={col.max}
          step={col.step}
          onChange={(e) => setEditValues((prev) => ({ ...prev, [col.field]: e.target.value }))}
          style={{ width: '80px' }}
        />
      );
    }

    return (
      <TextInput
        size="sm"
        type="text"
        value={String(val)}
        onChange={(e) => setEditValues((prev) => ({ ...prev, [col.field]: e.target.value }))}
        style={{ minWidth: '100px' }}
      />
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--_color---text--secondary)',
    textAlign: 'left',
    borderBottom: '2px solid var(--_color---border--primary)',
    fontFamily: 'var(--_typography---font-family--body)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    color: 'var(--_color---text--primary)',
    borderBottom: '1px solid var(--_color---border--primary)',
    fontFamily: 'var(--_typography---font-family--body)',
    verticalAlign: 'top',
  };

  return (
    <Card variant="elevated" padding="lg">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ ...thStyle, width: col.width }}>
                  {col.header}
                </th>
              ))}
              <th style={{ ...thStyle, width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ ...tdStyle, textAlign: 'center', color: 'var(--_color---text--muted)' }}>
                  No items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.key} style={tdStyle}>
                      {isEditing && !col.readOnly
                        ? renderEditCell(col)
                        : renderCell(item, col)
                      }
                    </td>
                  ))}
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => saveEdit(item)}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(item)}
                        disabled={editingId !== null}
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
