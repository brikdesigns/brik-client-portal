-- Migration 00020: project_services junction table
-- Links projects to services (many-to-many) for service badge display and filtering

CREATE TABLE public.project_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, service_id)
);

ALTER TABLE public.project_services ENABLE ROW LEVEL SECURITY;

-- RLS: same as projects — admins see all, clients see their own
CREATE POLICY "project_services_select" ON public.project_services
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.company_users cu ON cu.company_id = p.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

CREATE POLICY "project_services_admin_manage" ON public.project_services
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

CREATE INDEX idx_project_services_project ON public.project_services(project_id);
CREATE INDEX idx_project_services_service ON public.project_services(service_id);
