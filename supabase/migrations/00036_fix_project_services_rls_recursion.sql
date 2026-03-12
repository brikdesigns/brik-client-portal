-- Fix infinite recursion in project_services SELECT policy
-- The previous policy joined company_users directly, which triggered company_users RLS
-- policies (including self-referencing owner_manage), causing infinite recursion.
-- Fix: use is_company_member() SECURITY DEFINER function which bypasses RLS.

DROP POLICY IF EXISTS project_services_select ON project_services;

CREATE POLICY project_services_select ON project_services
  FOR SELECT USING (
    is_brik_admin()
    OR is_company_member(
      (SELECT p.company_id FROM projects p WHERE p.id = project_id)
    )
  );
