'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Button } from '@bds/components/ui/Button/Button';
import { TaskStatusBadge } from '@/components/status-badges';
import { TaskActionModal } from '@/components/task-action-modal';
import { border, color, font, gap, shadow, space } from '@/lib/tokens';
import type { TaskTemplate, TaskStatus, SubtaskTemplate, ServiceWorkflowConfig } from '@/lib/tasks/task-config';
import { getSubtaskProgress, type ServiceTask } from '@/lib/tasks/task-utils';

// ── Subtask Row ────────────────────────────────────────────

interface SubtaskRowProps {
  subtask: ServiceTask;
  template: SubtaskTemplate;
  disabled: boolean;
}

function SubtaskRow({ subtask, template, disabled }: SubtaskRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isManual = !template.automationRef && !template.actionConfig;
  const hasAction = !!template.actionConfig;

  async function updateStatus(newStatus: TaskStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update subtask');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  let actions: React.ReactNode = null;

  if (subtask.status === 'not_started') {
    actions = isManual ? (
      <Button variant="secondary" size="sm" onClick={() => updateStatus('completed')} disabled={loading || disabled}>
        Mark Done
      </Button>
    ) : hasAction ? (
      <TaskActionModal
        taskId={subtask.id}
        actionConfig={template.actionConfig!}
        onComplete={() => router.refresh()}
      >
        {({ onClick, loading: modalLoading }) => (
          <Button variant="primary" size="sm" onClick={onClick} loading={modalLoading} disabled={loading || disabled}>
            Start
          </Button>
        )}
      </TaskActionModal>
    ) : (
      <Button variant="primary" size="sm" onClick={() => updateStatus('in_progress')} disabled={loading || disabled}>
        Start
      </Button>
    );
  } else if (subtask.status === 'in_progress') {
    actions = (
      <div style={{ display: 'flex', gap: gap.xs, alignItems: 'center' }}>
        <Button variant="primary" size="sm" onClick={() => updateStatus('completed')} disabled={loading}>
          Complete
        </Button>
        <Button variant="secondary" size="sm" onClick={() => updateStatus('blocked')} disabled={loading}>
          Block
        </Button>
      </div>
    );
  } else if (subtask.status === 'blocked') {
    actions = (
      <Button variant="secondary" size="sm" onClick={() => updateStatus('in_progress')} disabled={loading}>
        Unblock
      </Button>
    );
  } else if (subtask.status === 'completed') {
    actions = (
      <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted }}>
        {subtask.completed_at ? new Date(subtask.completed_at).toLocaleDateString() : 'Done'}
      </span>
    );
  }

  const rowOpacity = 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${space.md} ${space.xl} ${space.md} ${space.md}`,
        borderBottom: `${border.width.sm} solid ${color.border.secondary}`,
        opacity: rowOpacity,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, flex: 1, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: font.family.label,
            fontSize: font.size.body.sm,
            fontWeight: font.weight.medium,
            color: color.text.primary,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {template.label}
            {isManual && (
              <span style={{
                display: 'inline-block',
                marginLeft: gap.xs,
                padding: `${border.width.sm} ${gap.xs}`,
                borderRadius: border.radius.sm,
                backgroundColor: color.border.secondary,
                color: color.text.muted,
                fontSize: font.size.body.xs,
                fontWeight: font.weight.medium,
                verticalAlign: 'middle',
                lineHeight: '1.4',
              }}>
                Manual
              </span>
            )}
            {!subtask.is_required && (
              <span style={{ color: color.text.muted, fontWeight: font.weight.regular, marginLeft: gap.xs }}>
                (optional)
              </span>
            )}
          </p>
          <p style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.xs,
            color: color.text.muted,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {template.description}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, flexShrink: 0, marginLeft: gap.sm }}>
        <TaskStatusBadge status={subtask.status} />
        {actions}
      </div>
    </div>
  );
}

// ── Main TaskCard ──────────────────────────────────────────

interface TaskCardProps {
  taskId: string;
  template: TaskTemplate;
  status: TaskStatus;
  isLocked: boolean;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  subtasks: ServiceTask[];
  subtaskTemplates: SubtaskTemplate[];
  allTasks: ServiceTask[];
  workflow: ServiceWorkflowConfig;
}

export function TaskCard({
  taskId,
  template,
  status,
  isLocked,
  notes,
  startedAt,
  completedAt,
  subtasks,
  subtaskTemplates,
  allTasks,
  workflow,
}: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasSubtasks = subtasks.length > 0;

  async function updateStatus(newStatus: TaskStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update task');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const displayStatus = isLocked ? 'locked' : status;
  const isGate = template.triggerType === 'approval_gate';
  const isManualTask = template.triggerType === 'manual' && !hasSubtasks;

  // Progress counter for subtasks
  const subtaskProgress = hasSubtasks ? getSubtaskProgress(subtasks) : null;

  // Manual tag element — reused in badge and action areas
  const manualTag = template.triggerType === 'manual' ? (
    <span style={{
      display: 'inline-block',
      padding: `${border.width.sm} ${gap.xs}`,
      borderRadius: border.radius.sm,
      backgroundColor: color.border.secondary,
      color: color.text.muted,
      fontFamily: font.family.label,
      fontSize: font.size.body.xs,
      fontWeight: font.weight.medium,
      lineHeight: '1.4',
    }}>
      Manual
    </span>
  ) : null;

  // Build action buttons
  let actionContent: React.ReactNode = null;

  if (isLocked) {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        {manualTag}
        <TaskStatusBadge status="locked" />
      </div>
    );
  } else if (status === 'not_started') {
    const hasAction = !!template.actionConfig;
    const startLabel = isGate ? 'Begin Review' : 'Start';

    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        {manualTag}
        <TaskStatusBadge status={displayStatus} />
        {isManualTask ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateStatus('completed')}
            disabled={loading}
          >
            Mark Done
          </Button>
        ) : hasAction ? (
          <TaskActionModal
            taskId={taskId}
            actionConfig={template.actionConfig!}
            onComplete={() => router.refresh()}
          >
            {({ onClick, loading: modalLoading }) => (
              <Button
                variant="primary"
                size="sm"
                onClick={onClick}
                loading={modalLoading}
                disabled={loading}
              >
                {startLabel}
              </Button>
            )}
          </TaskActionModal>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => updateStatus('in_progress')}
            disabled={loading}
          >
            {startLabel}
          </Button>
        )}
      </div>
    );
  } else if (status === 'in_progress') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        {manualTag}
        <TaskStatusBadge status={displayStatus} />
        {/* Only show Complete button if task has no subtasks — otherwise completion is derived */}
        {!hasSubtasks && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => updateStatus('completed')}
            disabled={loading}
          >
            {isGate ? 'Approve' : 'Complete'}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('blocked')}
          disabled={loading}
        >
          Block
        </Button>
      </div>
    );
  } else if (status === 'blocked') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        {manualTag}
        <TaskStatusBadge status={displayStatus} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
        >
          Unblock
        </Button>
      </div>
    );
  } else if (status === 'completed') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        {manualTag}
        <TaskStatusBadge status={displayStatus} />
        {completedAt && (
          <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted }}>
            {new Date(completedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  const cardOpacity = isLocked ? 0.5 : 1;

  // Badge area — currently unused (manual tag moved to action area)
  const badgeContent = undefined;

  // Chevron toggle — BDS Button with icon-only styling
  const chevron = hasSubtasks ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(!expanded); }}
      aria-label={expanded ? 'Collapse substeps' : 'Expand substeps'}
      style={{ flexShrink: 0 }}
    >
      <span style={{
        display: 'inline-block',
        fontSize: font.size.body.xs,
        transition: 'transform 0.2s ease',
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        lineHeight: font.lineHeight.none,
      }}>
        ▶
      </span>
    </Button>
  ) : null;

  return (
    <div>
      <CardControl
        title={template.label}
        description={template.description}
        badge={badgeContent}
        action={chevron ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
            {subtaskProgress && (
              <span style={{
                fontFamily: font.family.label,
                fontSize: font.size.body.xs,
                color: color.text.muted,
                fontWeight: font.weight.medium,
              }}>
                {subtaskProgress.completed}/{subtaskProgress.total}
              </span>
            )}
            {actionContent}
            {chevron}
          </div>
        ) : actionContent}
        style={{
          boxShadow: shadow.sm,
          opacity: cardOpacity,
          transition: 'opacity 0.2s ease',
          cursor: hasSubtasks ? 'pointer' : undefined,
          ...(hasSubtasks && expanded ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}),
        }}
        onClick={hasSubtasks ? () => setExpanded(!expanded) : undefined}
      />

      {/* Expanded substep panel */}
      {hasSubtasks && expanded && (
        <div
          style={{
            border: `${border.width.sm} solid ${color.border.secondary}`,
            borderTop: 'none',
            borderBottomLeftRadius: border.radius.md,
            borderBottomRightRadius: border.radius.md,
            backgroundColor: color.background.secondary,
            overflow: 'hidden',
          }}
        >
          {subtasks.map((st) => {
            const stTemplate = subtaskTemplates.find((t) => t.key === st.task_key);
            if (!stTemplate) return null;

            return (
              <SubtaskRow
                key={st.id}
                subtask={st}
                template={stTemplate}
                disabled={isLocked}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
