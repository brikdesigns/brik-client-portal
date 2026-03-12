/**
 * Helpers for service task workflows.
 */

import type { TaskPhase, TaskStatus, TaskTemplate, ServiceWorkflowConfig } from './task-config';

// ── Types matching DB rows ───────────────────────────────────

export interface ServiceTask {
  id: string;
  company_service_id: string;
  task_key: string;
  phase: TaskPhase;
  status: TaskStatus;
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Dependency checks ────────────────────────────────────────

/**
 * Check if a task is unlocked (all dependencies completed or skipped).
 */
export function isTaskUnlocked(
  task: ServiceTask,
  allTasks: ServiceTask[],
  workflow: ServiceWorkflowConfig,
): boolean {
  // Already started or done — always "unlocked"
  if (task.status !== 'not_started') return true;

  const template = workflow.tasks.find((t) => t.key === task.task_key);
  if (!template) return false;

  // No dependencies — always unlocked
  if (template.dependsOn.length === 0) return true;

  return template.dependsOn.every((depKey) => {
    const dep = allTasks.find((t) => t.task_key === depKey);
    return dep && (dep.status === 'completed' || dep.status === 'skipped');
  });
}

/**
 * Get the template for a task instance.
 */
export function getTaskTemplate(
  task: ServiceTask,
  workflow: ServiceWorkflowConfig,
): TaskTemplate | undefined {
  return workflow.tasks.find((t) => t.key === task.task_key);
}

// ── Phase progress ───────────────────────────────────────────

export interface PhaseProgress {
  phase: TaskPhase;
  label: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
}

/**
 * Calculate progress for each phase.
 */
export function getPhaseProgress(
  tasks: ServiceTask[],
  workflow: ServiceWorkflowConfig,
): PhaseProgress[] {
  return workflow.phases.map(({ key, label }) => {
    const phaseTasks = tasks.filter((t) => t.phase === key);
    return {
      phase: key,
      label,
      total: phaseTasks.length,
      completed: phaseTasks.filter((t) => t.status === 'completed' || t.status === 'skipped').length,
      inProgress: phaseTasks.filter((t) => t.status === 'in_progress').length,
      blocked: phaseTasks.filter((t) => t.status === 'blocked').length,
    };
  });
}

/**
 * Group tasks by phase, maintaining sort order.
 */
export function groupTasksByPhase(
  tasks: ServiceTask[],
  workflow: ServiceWorkflowConfig,
): Map<TaskPhase, ServiceTask[]> {
  const grouped = new Map<TaskPhase, ServiceTask[]>();
  for (const phase of workflow.phases) {
    grouped.set(
      phase.key,
      tasks.filter((t) => t.phase === phase.key).sort((a, b) => a.sort_order - b.sort_order),
    );
  }
  return grouped;
}

// ── Validation ───────────────────────────────────────────────

/**
 * Validate that a status transition is allowed.
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  const allowed: Record<TaskStatus, TaskStatus[]> = {
    not_started: ['in_progress', 'skipped'],
    in_progress: ['completed', 'blocked', 'not_started'],
    completed: ['in_progress'], // Allow reopening
    blocked: ['in_progress', 'skipped'],
    skipped: ['not_started'],
  };
  return allowed[from]?.includes(to) ?? false;
}
