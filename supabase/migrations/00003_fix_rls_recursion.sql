-- Fix: Infinite recursion in RLS policies
-- The admin check `(select role from profiles where id = auth.uid())` causes
-- infinite recursion when querying the profiles table itself.
-- Solution: SECURITY DEFINER function that bypasses RLS to read the role.

-- ============================================
-- 1. Helper function: get current user's role (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================
-- 2. Fix PROFILES policies
-- ============================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR public.get_user_role() = 'admin'
  );

-- ============================================
-- 3. Fix CLIENTS policies
-- ============================================
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "clients_admin_manage" ON public.clients;
CREATE POLICY "clients_admin_manage" ON public.clients
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 4. Fix PROJECTS policies
-- ============================================
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "projects_admin_manage" ON public.projects;
CREATE POLICY "projects_admin_manage" ON public.projects
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 5. Fix INVOICES policies
-- ============================================
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "invoices_admin_manage" ON public.invoices;
CREATE POLICY "invoices_admin_manage" ON public.invoices
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 6. Fix EMAIL_LOG policies
-- ============================================
DROP POLICY IF EXISTS "email_log_admin_only" ON public.email_log;
CREATE POLICY "email_log_admin_only" ON public.email_log
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 7. Fix SERVICE_CATEGORIES policies
-- ============================================
DROP POLICY IF EXISTS "service_categories_select" ON public.service_categories;
CREATE POLICY "service_categories_select" ON public.service_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "service_categories_admin_manage" ON public.service_categories;
CREATE POLICY "service_categories_admin_manage" ON public.service_categories
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 8. Fix SERVICES policies
-- ============================================
DROP POLICY IF EXISTS "services_select" ON public.services;
CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "services_admin_manage" ON public.services;
CREATE POLICY "services_admin_manage" ON public.services
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 9. Fix CLIENT_SERVICES policies
-- ============================================
DROP POLICY IF EXISTS "client_services_select" ON public.client_services;
CREATE POLICY "client_services_select" ON public.client_services
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "client_services_admin_manage" ON public.client_services;
CREATE POLICY "client_services_admin_manage" ON public.client_services
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );
