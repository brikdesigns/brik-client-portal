'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { ItemStatusBadge } from '@/components/report-badges';
import { font, color, gap, space } from '@/lib/tokens';
import { type ColumnConfig, getColumnConfig, getRubric, type ReportType } from '@/lib/analysis/report-config';
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

      // Regenerate opportunities text from updated items
      await fetch('/api/admin/reporting/refresh-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });

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

  function renderEditCell(col: ColumnConfig, editingItem?: ReportItem) {
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
          style={{ minWidth: '120px', fontSize: font.size.body.xs }}
        />
      );
    }

    if (col.inputType === 'number') {
      // For score fields, use the item's maxScore from metadata if available
      const effectiveMax = col.field === 'score' && editingItem
        ? (editingItem.metadata?.maxScore as number | undefined) ?? col.max
        : col.max;
      return (
        <TextInput
          size="sm"
          type="number"
          value={val === null ? '' : String(val)}
          min={col.min}
          max={effectiveMax}
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
    padding: `${space.sm} ${space.sm}`,
    fontSize: font.size.body.xs,
    fontWeight: font.weight.semibold,
    color: color.text.secondary,
    textAlign: 'left',
    borderBottom: `2px solid ${color.border.primary}`,
    fontFamily: font.family.body,
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: `${space.sm} ${space.sm}`,
    fontSize: font.size.body.sm,
    color: color.text.primary,
    borderBottom: `1px solid ${color.border.primary}`,
    fontFamily: font.family.body,
    verticalAlign: 'top',
  };

  return (
    <div>
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
                <td colSpan={columns.length + 1} style={{ ...tdStyle, textAlign: 'center', color: color.text.muted }}>
                  No items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isEditing = editingId === item.id;
              const rubric = isEditing ? getRubric(reportType, item.category) : undefined;
              return (
                <React.Fragment key={item.id}>
                  <tr>
                    {columns.map((col) => (
                      <td key={col.key} style={tdStyle}>
                        {isEditing && !col.readOnly
                          ? renderEditCell(col, item)
                          : renderCell(item, col)
                        }
                      </td>
                    ))}
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: gap.tiny, justifyContent: 'flex-end' }}>
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
                  {isEditing && rubric && (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        style={{
                          padding: `${space.xs} ${space.sm} ${space.md}`,
                          borderBottom: `1px solid ${color.border.primary}`,
                          background: color.background.secondary,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: font.family.body,
                            fontSize: font.size.body.xs,
                            fontWeight: font.weight.semibold,
                            color: color.text.secondary,
                            marginBottom: gap.xs,
                          }}
                        >
                          Scoring rubric
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.tiny }}>
                          {Object.entries(rubric)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([score, desc]) => (
                              <div
                                key={score}
                                style={{
                                  display: 'flex',
                                  gap: gap.xs,
                                  fontFamily: font.family.body,
                                  fontSize: font.size.body.xs,
                                  lineHeight: font.lineHeight.snug,
                                  color: color.text.secondary,
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: font.weight.bold,
                                    color: color.text.primary,
                                    minWidth: '14px',
                                  }}
                                >
                                  {score}
                                </span>
                                <span>{desc}</span>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
