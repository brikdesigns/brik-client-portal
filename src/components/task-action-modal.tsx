'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { color, space } from '@/lib/tokens';
import { text } from '@/lib/styles';
import type { TaskActionConfig } from '@/lib/tasks/task-config';

interface IntakeFormOption {
  id: string;
  title: string;
  industry: string | null;
  subIndustry: string | null;
  projectType: string[];
  lastEdited: string;
}

interface TaskActionModalProps {
  taskId: string;
  actionConfig: TaskActionConfig;
  onComplete: () => void;
  children: (props: { onClick: () => void; loading: boolean }) => React.ReactNode;
}

/**
 * Modal for task actions that require data selection before starting.
 * Currently supports `notion_select` — a dropdown populated from a Notion database.
 */
export function TaskActionModal({
  taskId,
  actionConfig,
  onComplete,
  children,
}: TaskActionModalProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<IntakeFormOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAndOpen = useCallback(async () => {
    setLoadingOptions(true);
    setError('');
    setSelectedId('');
    setOptions([]);

    try {
      const res = await fetch('/api/admin/notion/intake-forms');
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        setOptions(results);
        if (results.length === 1) {
          setSelectedId(results[0].id);
        }
      } else {
        setError('Failed to load intake forms');
      }
    } catch {
      setError('Failed to connect to Notion');
    } finally {
      setLoadingOptions(false);
      setShowModal(true);
    }
  }, []);

  async function handleBegin() {
    if (!selectedId) {
      setError('Select an intake form to continue.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          metadata: {
            notion_page_id: selectedId,
            notion_data_source_id: actionConfig.notionDataSourceId,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to start task');
        return;
      }

      setShowModal(false);
      onComplete();
      router.refresh();
    } catch {
      setError('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  }

  const selected = options.find((o) => o.id === selectedId);

  return (
    <>
      {children({ onClick: fetchAndOpen, loading: loadingOptions })}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={actionConfig.label}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleBegin}
              loading={submitting}
              disabled={!selectedId}
            >
              Begin
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <p style={{ ...text.body, margin: 0 }}>
            {actionConfig.description}
          </p>

          <Select
            label="Intake form"
            placeholder={
              options.length === 0
                ? 'No intake forms found'
                : 'Select an intake form...'
            }
            options={options.map((opt) => ({
              label: opt.title,
              value: opt.id,
            }))}
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setError('');
            }}
            helperText={
              selected
                ? [
                    selected.subIndustry || selected.industry,
                    selected.projectType.join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ') || undefined
                : undefined
            }
            size="md"
          />

          {error && (
            <p style={{ ...text.body, color: color.system.red, margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
