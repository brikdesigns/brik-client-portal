-- Fix project_services RLS: replace get_user_role() = 'admin' with is_brik_admin()
-- The old policies used the pre-rename role check which broke after 00026 renamed admin → super_admin

DROP POLICY IF EXISTS project_services_select ON project_services;
DROP POLICY IF EXISTS project_services_admin_manage ON project_services;

CREATE POLICY project_services_select ON project_services
  FOR SELECT USING (
    is_brik_admin() OR (
      project_id IN (
        SELECT p.id FROM projects p
        JOIN company_users cu ON cu.company_id = p.company_id
        WHERE cu.user_id = auth.uid()
      )
    )
  );

CREATE POLICY project_services_admin_manage ON project_services
  FOR ALL USING (is_brik_admin());
