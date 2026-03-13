'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Button } from '@bds/components/ui/Button/Button';
import { TaskStatusBadge } from '@/components/status-badges';
import { color, font, gap, shadow } from '@/lib/tokens';
import type { TaskTemplate, TaskStatus } from '@/lib/tasks/task-config';

interface TaskCardProps {
  taskId: string;
  template: TaskTemplate;
  status: TaskStatus;
  isLocked: boolean;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function TaskCard({
  taskId,
  template,
  status,
  isLocked,
  notes,
  startedAt,
  completedAt,
}: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  // Determine action buttons based on current status
  let actionContent: React.ReactNode = null;

  if (isLocked) {
    actionContent = <TaskStatusBadge status="locked" />;
  } else if (status === 'not_started') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        <TaskStatusBadge status={displayStatus} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
        >
          {isGate ? 'Begin Review' : 'Start'}
        </Button>
      </div>
    );
  } else if (status === 'in_progress') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        <TaskStatusBadge status={displayStatus} />
        <Button
          variant="primary"
          size="sm"
          onClick={() => updateStatus('completed')}
          disabled={loading}
        >
          {isGate ? 'Approve' : 'Complete'}
        </Button>
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
        <TaskStatusBadge status={displayStatus} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
        >
          Unblock
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('skipped')}
          disabled={loading}
        >
          Skip
        </Button>
      </div>
    );
  } else if (status === 'completed') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        <TaskStatusBadge status={displayStatus} />
        {completedAt && (
          <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted }}>
            {new Date(completedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  } else if (status === 'skipped') {
    actionContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
        <TaskStatusBadge status={displayStatus} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('not_started')}
          disabled={loading}
        >
          Reopen
        </Button>
      </div>
    );
  }

  const cardOpacity = isLocked ? 0.5 : status === 'completed' || status === 'skipped' ? 0.75 : 1;

  return (
    <CardControl
      title={template.label}
      description={template.description}
      action={actionContent}
      style={{
        boxShadow: shadow.sm,
        opacity: cardOpacity,
        transition: 'opacity 0.2s ease',
      }}
    />
  );
}
