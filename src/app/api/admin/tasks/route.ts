import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';
import { getWorkflowConfig } from '@/lib/tasks/task-config';

const initializeSchema = z.object({
  company_service_id: uuidSchema,
  service_slug: z.string().min(1),
});

/**
 * POST /api/admin/tasks
 *
 * Initialize all tasks for a company-service assignment from the workflow template.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await parseBody(request, initializeSchema);
  if (isValidationError(body)) return body;

  const { company_service_id, service_slug } = body;

  const workflow = getWorkflowConfig(service_slug);
  if (!workflow) {
    return NextResponse.json(
      { error: `No workflow defined for service: ${service_slug}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Check if tasks already exist for this assignment
  const { count } = await supabase
    .from('service_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('company_service_id', company_service_id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Tasks already initialized for this service assignment' },
      { status: 409 },
    );
  }

  // Create all task instances from the template (parents + subtasks)
  const rows: Array<{
    company_service_id: string;
    task_key: string;
    phase: string;
    sort_order: number;
    status: 'not_started';
    metadata: Record<string, never>;
    parent_task_key: string | null;
    is_required: boolean;
  }> = [];

  for (const t of workflow.tasks) {
    rows.push({
      company_service_id,
      task_key: t.key,
      phase: t.phase,
      sort_order: t.sortOrder,
      status: 'not_started',
      metadata: {},
      parent_task_key: null,
      is_required: true,
    });

    if (t.subtasks) {
      for (const st of t.subtasks) {
        rows.push({
          company_service_id,
          task_key: st.key,
          phase: t.phase,
          sort_order: st.sortOrder,
          status: 'not_started',
          metadata: {},
          parent_task_key: t.key,
          is_required: st.required !== false,
        });
      }
    }
  }

  const { data, error } = await supabase
    .from('service_tasks')
    .insert(rows)
    .select('id, task_key, phase, status, sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, count: data?.length ?? 0 }, { status: 201 });
}
