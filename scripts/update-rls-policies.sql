-- Update RLS policies to check client_users membership
-- Run this in Supabase Dashboard SQL Editor

-- CLIENTS table: Users can see clients they're members of
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = clients.id AND cu.user_id = auth.uid()
    )
  );

-- PROJECTS table: Users can see projects for clients they're members of
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = projects.client_id AND cu.user_id = auth.uid()
    )
  );

-- INVOICES table: Users can see invoices for clients they're members of
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = invoices.client_id AND cu.user_id = auth.uid()
    )
  );

-- CLIENT_SERVICES table: Users can see services for clients they're members of
DROP POLICY IF EXISTS "client_services_select" ON public.client_services;
CREATE POLICY "client_services_select" ON public.client_services
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = client_services.client_id AND cu.user_id = auth.uid()
    )
  );

-- Verification
SELECT 'RLS policies updated successfully!' as status;
