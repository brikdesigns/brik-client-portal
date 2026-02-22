import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTask } from '@/lib/clickup';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    company_id,
    description,
    status,
    start_date,
    end_date,
    clickup_list_id,
    clickup_assignee_id,
  } = body;

  if (!name || !company_id) {
    return NextResponse.json(
      { error: 'name and company_id are required' },
      { status: 400 }
    );
  }

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
    })
    .select('id, slug')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    project,
    clickup_task_id: clickupTaskId,
    clickup_warning: clickupWarning,
  });
}
