-- Migration: 00039_service_tasks.sql
-- Service task workflow tracking: one row per task per company-service assignment.
-- Task templates are defined in code (src/lib/tasks/task-config.ts).

create table public.service_tasks (
  id uuid primary key default gen_random_uuid(),
  company_service_id uuid not null references public.company_services(id) on delete cascade,
  task_key text not null,
  phase text not null check (phase in ('content', 'design', 'development')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'blocked', 'skipped')),
  sort_order integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_service_id, task_key)
);

-- Indexes
create index idx_service_tasks_company_service on public.service_tasks(company_service_id);
create index idx_service_tasks_status on public.service_tasks(status);

-- RLS
alter table public.service_tasks enable row level security;

-- Admins: full access
create policy "Admins can manage service tasks"
  on public.service_tasks for all
  using (public.is_brik_admin())
  with check (public.is_brik_admin());

-- Clients: read-only access to their own company's tasks
create policy "Clients can view their company service tasks"
  on public.service_tasks for select
  using (
    exists (
      select 1 from public.company_services cs
      where cs.id = service_tasks.company_service_id
        and public.is_company_member(cs.company_id)
    )
  );

-- Updated_at trigger (reuse the standard pattern)
create or replace function public.set_service_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger service_tasks_updated_at
  before update on public.service_tasks
  for each row execute function public.set_service_tasks_updated_at();
