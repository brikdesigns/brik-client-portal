import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createTask } from '@/lib/clickup';
import { parseBody, isValidationError, nonEmptyString, uuidSchema } from '@/lib/validation';

const projectSchema = z.object({
  name: nonEmptyString,
  company_id: uuidSchema,
  description: z.string().optional(),
  status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  clickup_list_id: z.string().optional(),
  clickup_assignee_id: z.number().optional(),
  service_ids: z.array(uuidSchema).optional(),
  company_service_id: uuidSchema.optional(),
});

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, projectSchema);
  if (isValidationError(body)) return body;
  const {
    name,
    company_id,
    description,
    status,
    start_date,
    end_date,
    clickup_list_id,
    clickup_assignee_id,
    service_ids,
    company_service_id,
  } = body;

  // ── Step 1: Try to create ClickUp task ─────────────────────
  let clickupTaskId: string | null = null;
  let clickupWarning: string | null = null;

  if (clickup_list_id) {
    try {
      const taskPayload: {
        name: string;
        description?: string;
        assignees?: number[];
        status?: string;
        start_date?: number;
        due_date?: number;
      } = {
        name,
        description: description || undefined,
        status: 'to do',
      };

      if (clickup_assignee_id) {
        taskPayload.assignees = [clickup_assignee_id];
      }

      if (start_date) {
        taskPayload.start_date = new Date(start_date).getTime();
      }

      if (end_date) {
        taskPayload.due_date = new Date(end_date).getTime();
      }

      const task = await createTask(clickup_list_id, taskPayload);
      clickupTaskId = task.id;
    } catch (err) {
      console.error('ClickUp task creation failed (non-blocking):', err);
      clickupWarning = 'Project created, but ClickUp task creation failed. You can link it manually later.';
    }
  }

  // ── Step 2: Create Supabase project ────────────────────────
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert({
      company_id,
      name,
      slug: toSlug(name),
      description: description || null,
      status: status || 'not_started',
      start_date: start_date || null,
      end_date: end_date || null,
      clickup_task_id: clickupTaskId,
      company_service_id: company_service_id || null,
    })
    .select('id, slug')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // ── Step 3: Link services to project ─────────────────────
  if (service_ids && service_ids.length > 0 && project) {
    await supabase
      .from('project_services')
      .insert(service_ids.map((sid) => ({ project_id: project.id, service_id: sid })));
  }

  return NextResponse.json({
    project,
    clickup_task_id: clickupTaskId,
    clickup_warning: clickupWarning,
  });
}
