'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Button } from '@bds/components/ui/Button/Button';
import { Counter } from '@bds/components/ui/Counter/Counter';
import { TaskCard } from '@/components/task-card';
import { font, color, gap, space, shadow } from '@/lib/tokens';
import { heading } from '@/lib/styles';
import type { ServiceWorkflowConfig } from '@/lib/tasks/task-config';
import {
  isTaskUnlocked,
  getTaskTemplate,
  getPhaseProgress,
  groupTasksByPhase,
  type ServiceTask,
} from '@/lib/tasks/task-utils';

interface TaskListProps {
  companyServiceId: string;
  serviceSlug: string;
  workflow: ServiceWorkflowConfig;
  tasks: ServiceTask[];
}

export function TaskList({ companyServiceId, serviceSlug, workflow, tasks }: TaskListProps) {
  const router = useRouter();
  const [initializing, setInitializing] = useState(false);

  // Not initialized yet — show the "Initialize Tasks" card
  if (tasks.length === 0) {
    return (
      <CardControl
        title="Service Tasks"
        description={`${workflow.tasks.length} steps across ${workflow.phases.map((p) => p.label).join(', ')} phases. Initialize to start tracking progress.`}
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={initializing}
            onClick={async () => {
              setInitializing(true);
              try {
                const res = await fetch('/api/admin/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ company_service_id: companyServiceId, service_slug: serviceSlug }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  alert(data.error || 'Failed to initialize tasks');
                  return;
                }
                router.refresh();
              } finally {
                setInitializing(false);
              }
            }}
          >
            {initializing ? 'Initializing...' : 'Initialize Tasks'}
          </Button>
        }
        style={{ boxShadow: shadow.sm }}
      />
    );
  }

  // Tasks exist — render phase-grouped card stack
  const phaseProgress = getPhaseProgress(tasks, workflow);
  const grouped = groupTasksByPhase(tasks, workflow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      {/* Phase progress summary */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${workflow.phases.length}, 1fr)`, gap: gap.md }}>
        {phaseProgress.map((p) => (
          <div
            key={p.phase}
            style={{
              padding: space.md,
              borderRadius: '8px',
              border: `1px solid ${color.border.secondary}`,
              backgroundColor: color.background.primary,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: gap.xs }}>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary }}>
                {p.label}
              </span>
              <Counter count={p.completed} max={p.total} />
            </div>
            <div style={{ height: '4px', borderRadius: '2px', backgroundColor: color.border.secondary, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: p.total > 0 ? `${(p.completed / p.total) * 100}%` : '0%',
                  backgroundColor: p.completed === p.total && p.total > 0 ? color.text.success : color.text.brand,
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Phase-grouped task cards */}
      {workflow.phases.map(({ key, label }) => {
        const phaseTasks = grouped.get(key) ?? [];
        if (phaseTasks.length === 0) return null;

        const progress = phaseProgress.find((p) => p.phase === key);

        return (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, marginBottom: space.md }}>
              <h2 style={{ ...heading.section, margin: 0 }}>{label}</h2>
              {progress && (
                <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted }}>
                  {progress.completed}/{progress.total}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
              {phaseTasks.map((task) => {
                const template = getTaskTemplate(task, workflow);
                if (!template) return null;

                const locked = !isTaskUnlocked(task, tasks, workflow);

                return (
                  <TaskCard
                    key={task.id}
                    taskId={task.id}
                    template={template}
                    status={task.status}
                    isLocked={locked}
                    notes={task.notes}
                    startedAt={task.started_at}
                    completedAt={task.completed_at}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
