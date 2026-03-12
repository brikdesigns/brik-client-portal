-- Migration 00037: Link projects to company service assignments
--
-- Adds company_service_id FK on projects so each project can be
-- tracked under a specific service instance for a client.
-- Nullable for backwards compatibility with existing projects.

-- 1. Add nullable FK from projects to company_services
alter table public.projects
  add column if not exists company_service_id uuid
    references public.company_services(id) on delete set null;

-- 2. Index for fast lookup of projects by service assignment
create index if not exists idx_projects_company_service_id
  on public.projects(company_service_id)
  where company_service_id is not null;
