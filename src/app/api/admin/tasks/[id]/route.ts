import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { parseBody, isValidationError } from '@/lib/validation';
import { isValidTransition, isTaskUnlocked, deriveParentStatus } from '@/lib/tasks/task-utils';
import { getWorkflowConfig } from '@/lib/tasks/task-config';
import type { TaskStatus } from '@/lib/tasks/task-config';
import type { ServiceTask } from '@/lib/tasks/task-utils';

const updateSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked', 'skipped']).optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * PATCH /api/admin/tasks/[id]
 *
 * Update a task's status, notes, or metadata.
 * Validates status transitions and dependency constraints.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  const body = await parseBody(request, updateSchema);
  if (isValidationError(body)) return body;

  const supabase = await createClient();

  // Fetch the task
  const { data: task, error: fetchError } = await supabase
    .from('service_tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const currentTask = task as ServiceTask;

  // If updating status, validate transition and dependencies
  if (body.status && body.status !== currentTask.status) {
    const newStatus = body.status as TaskStatus;

    // Validate transition
    if (!isValidTransition(currentTask.status, newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentTask.status} to ${newStatus}` },
        { status: 400 },
      );
    }

    // Block manual "Complete" on parent tasks that have subtasks — completion must come from substeps
    if (newStatus === 'completed' && !currentTask.parent_task_key) {
      const { count: subtaskCount } = await supabase
        .from('service_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('company_service_id', currentTask.company_service_id)
        .eq('parent_task_key', currentTask.task_key);

      if (subtaskCount && subtaskCount > 0) {
        return NextResponse.json(
          { error: 'Complete all required substeps to finish this task' },
          { status: 400 },
        );
      }
    }

    // For starting a task, check dependencies
    if (newStatus === 'in_progress') {
      if (currentTask.parent_task_key) {
        // Subtasks: auto-start the parent if it's still not_started
        const { data: parent } = await supabase
          .from('service_tasks')
          .select('id, status, started_at')
          .eq('company_service_id', currentTask.company_service_id)
          .eq('task_key', currentTask.parent_task_key)
          .is('parent_task_key', null)
          .single();

        if (!parent) {
          return NextResponse.json(
            { error: 'Parent task not found' },
            { status: 400 },
          );
        }

        if (parent.status === 'not_started') {
          await supabase
            .from('service_tasks')
            .update({
              status: 'in_progress',
              started_at: new Date().toISOString(),
            })
            .eq('id', parent.id);
        }
      } else {
        // Top-level tasks: check workflow dependencies
        const { data: cs } = await supabase
          .from('company_services')
          .select('services(slug)')
          .eq('id', currentTask.company_service_id)
          .single();

        const serviceSlug = (cs as unknown as Record<string, { slug: string }>)?.services?.slug;
        const workflow = serviceSlug ? getWorkflowConfig(serviceSlug) : null;

        if (workflow) {
          const { data: allTasks } = await supabase
            .from('service_tasks')
            .select('*')
            .eq('company_service_id', currentTask.company_service_id);

          if (!isTaskUnlocked(currentTask, (allTasks ?? []) as ServiceTask[], workflow)) {
            return NextResponse.json(
              { error: 'Dependencies not met — complete prerequisite tasks first' },
              { status: 400 },
            );
          }
        }
      }
    }
  }

  // Build the update payload
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'in_progress' && !currentTask.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (body.status === 'completed') {
      updates.completed_at = new Date().toISOString();
      // Direct not_started → completed (manual "Mark Done"): also set started_at
      if (!currentTask.started_at) {
        updates.started_at = new Date().toISOString();
      }
    }
    if (body.status === 'not_started') {
      updates.completed_at = null;
    }
  }

  if (body.notes !== undefined) updates.notes = body.notes;

  if (body.metadata !== undefined) {
    updates.metadata = { ...(currentTask.metadata ?? {}), ...body.metadata };
  }

  const { data: updated, error: updateError } = await supabase
    .from('service_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Auto-complete parent when a subtask finishes
  if (body.status && currentTask.parent_task_key) {
    const { data: siblings } = await supabase
      .from('service_tasks')
      .select('*')
      .eq('company_service_id', currentTask.company_service_id)
      .eq('parent_task_key', currentTask.parent_task_key);

    // Use the just-updated status for the current task
    const updatedSiblings = ((siblings ?? []) as ServiceTask[]).map((s) =>
      s.id === id ? { ...s, status: body.status as TaskStatus } : s,
    );

    const derivedStatus = deriveParentStatus(updatedSiblings);

    const { data: parent } = await supabase
      .from('service_tasks')
      .select('*')
      .eq('company_service_id', currentTask.company_service_id)
      .eq('task_key', currentTask.parent_task_key)
      .is('parent_task_key', null)
      .single();

    if (parent && (parent as ServiceTask).status !== derivedStatus) {
      const parentUpdates: Record<string, unknown> = { status: derivedStatus };
      if (derivedStatus === 'completed') {
        parentUpdates.completed_at = new Date().toISOString();
      }
      if (derivedStatus === 'in_progress' && !(parent as ServiceTask).started_at) {
        parentUpdates.started_at = new Date().toISOString();
      }
      if (derivedStatus === 'not_started') {
        parentUpdates.completed_at = null;
      }

      await supabase
        .from('service_tasks')
        .update(parentUpdates)
        .eq('id', parent.id);
    }
  }

  return NextResponse.json({ task: updated });
}
