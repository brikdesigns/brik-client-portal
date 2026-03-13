-- Add subtask hierarchy to service_tasks.
-- parent_task_key links a substep to its parent task (null = top-level task).
-- is_required controls whether a substep must complete for parent auto-completion.

alter table public.service_tasks
  add column parent_task_key text;

alter table public.service_tasks
  add column is_required boolean not null default true;

-- Replace the single unique constraint with partial indexes that handle the null parent case.
alter table public.service_tasks
  drop constraint service_tasks_company_service_id_task_key_key;

-- Top-level tasks: unique on (company_service_id, task_key) where parent is null
create unique index idx_service_tasks_unique_top_level
  on public.service_tasks (company_service_id, task_key)
  where parent_task_key is null;

-- Subtasks: unique on (company_service_id, parent_task_key, task_key)
create unique index idx_service_tasks_unique_subtask
  on public.service_tasks (company_service_id, parent_task_key, task_key)
  where parent_task_key is not null;

-- Fast subtask lookups by parent
create index idx_service_tasks_parent
  on public.service_tasks (company_service_id, parent_task_key)
  where parent_task_key is not null;
