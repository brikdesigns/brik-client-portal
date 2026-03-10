-- Migration: 00026_rbac_foundation.sql
-- RBAC Foundation: Role hierarchy, property support, permission functions
--
-- Changes:
-- 1. Rename profiles.role 'admin' → 'super_admin' (disambiguate from company-level admin)
-- 2. Add parent_id to companies for property hierarchy (multi-location, agency sub-clients)
-- 3. Create is_brik_admin() helper (cleaner than string comparison in policies)
-- 4. Create get_company_role() and has_company_permission() functions
-- 5. Update ALL RLS policies: use is_brik_admin(), add client read access where missing
-- 6. Add property-aware membership checks (parent company access → child access)

-- ============================================
-- 1. RENAME SYSTEM ROLE: admin → super_admin
-- ============================================
-- This clears the namespace: 'admin' will only mean company-level admin (in company_users).
-- 'super_admin' = Brik employees (platform operators). 'client' = everyone else.

-- Drop and recreate the constraint (can't ALTER CHECK constraints)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'client'));

-- ============================================
-- 2. ADD PARENT_ID to companies (property hierarchy)
-- ============================================
-- NULL = top-level company (direct Brik client)
-- Non-NULL = property/location/sub-client of the parent company
-- Examples:
--   Dental Group of TN (parent) → Downtown Office, East Memphis Office (children)
--   Regional Marketing Agency (parent) → Their Client 1, Their Client 2 (children)

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_id uuid
  REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON public.companies(parent_id)
  WHERE parent_id IS NOT NULL;

COMMENT ON COLUMN public.companies.parent_id IS
  'Self-referential FK for property hierarchy. NULL = top-level company. Non-NULL = child property of parent.';

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- is_brik_admin(): Boolean check for platform-level admin (replaces string comparison)
CREATE OR REPLACE FUNCTION public.is_brik_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

COMMENT ON FUNCTION public.is_brik_admin IS
  'Returns true if current user is a Brik platform admin (super_admin). SECURITY DEFINER bypasses RLS.';

-- Update get_user_role() to return the new value (backward compat for any direct callers)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- get_company_role(): Returns user's role within a specific company
-- Handles property hierarchy: if user has role at parent, that role applies to children
CREATE OR REPLACE FUNCTION public.get_company_role(p_company_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT cu.role
  FROM public.company_users cu
  WHERE cu.user_id = auth.uid()
    AND (
      cu.company_id = p_company_id
      OR cu.company_id = (
        SELECT parent_id FROM public.companies WHERE id = p_company_id
      )
    )
  ORDER BY
    -- Direct membership takes priority over inherited
    CASE WHEN cu.company_id = p_company_id THEN 0 ELSE 1 END
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_company_role IS
  'Returns user role for a company. Checks direct membership first, then parent company membership.';

-- is_company_member(): Boolean check for company membership (including parent hierarchy)
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.user_id = auth.uid()
      AND (
        cu.company_id = p_company_id
        OR cu.company_id = (
          SELECT parent_id FROM public.companies WHERE id = p_company_id
        )
      )
  )
$$;

COMMENT ON FUNCTION public.is_company_member IS
  'Returns true if user has any membership at this company or its parent.';

-- has_company_permission(): Check specific permission based on company role
CREATE OR REPLACE FUNCTION public.has_company_permission(p_company_id uuid, p_permission text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT p_permission = ANY(
    CASE public.get_company_role(p_company_id)
      WHEN 'owner' THEN ARRAY[
        'company.manage', 'company.settings', 'users.manage', 'users.view',
        'properties.manage',
        'projects.view', 'projects.manage',
        'invoices.view', 'invoices.manage',
        'proposals.view', 'proposals.accept',
        'reports.view',
        'services.view',
        'agreements.view', 'agreements.sign'
      ]
      WHEN 'admin' THEN ARRAY[
        'users.view',
        'projects.view', 'projects.manage',
        'invoices.view',
        'proposals.view', 'proposals.accept',
        'reports.view',
        'services.view',
        'agreements.view', 'agreements.sign'
      ]
      WHEN 'member' THEN ARRAY[
        'projects.view',
        'services.view',
        'reports.view'
      ]
      WHEN 'viewer' THEN ARRAY[
        'projects.view'
      ]
      ELSE ARRAY[]::text[]
    END
  )
$$;

COMMENT ON FUNCTION public.has_company_permission IS
  'Check if user has a specific permission for a company based on their company_users role. Roles: owner > admin > member > viewer.';

-- ============================================
-- 4. UPDATE ALL RLS POLICIES
-- ============================================
-- Replace get_user_role() = 'admin' with is_brik_admin()
-- Add client read access to tables that were admin-only (proposals, reports, agreements)
-- Use is_company_member() for membership checks

-- --- PROFILES ---
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_brik_admin()
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_brik_admin()
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR public.is_brik_admin()
  );

-- Keep profiles_admin_manage if it exists
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;

-- --- COMPANIES ---
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    public.is_brik_admin()
    OR public.is_company_member(id)
  );

DROP POLICY IF EXISTS "companies_admin_manage" ON public.companies;
CREATE POLICY "companies_admin_manage" ON public.companies
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- COMPANY_USERS ---
DROP POLICY IF EXISTS "company_users_select" ON public.company_users;
CREATE POLICY "company_users_select" ON public.company_users
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_brik_admin()
    -- Company owners can see all members of their company
    OR EXISTS (
      SELECT 1 FROM public.company_users my_cu
      WHERE my_cu.user_id = auth.uid()
        AND my_cu.company_id = company_users.company_id
        AND my_cu.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "company_users_admin_manage" ON public.company_users;
CREATE POLICY "company_users_admin_manage" ON public.company_users
  FOR ALL USING (
    public.is_brik_admin()
  );

-- Company owners can manage their own company's members
CREATE POLICY "company_users_owner_manage" ON public.company_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.company_users my_cu
      WHERE my_cu.user_id = auth.uid()
        AND my_cu.company_id = company_users.company_id
        AND my_cu.role = 'owner'
    )
  );

-- --- CONTACTS ---
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT USING (
    public.is_brik_admin()
    OR public.is_company_member(company_id)
  );

DROP POLICY IF EXISTS "contacts_admin_manage" ON public.contacts;
CREATE POLICY "contacts_admin_manage" ON public.contacts
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- PROJECTS ---
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.is_brik_admin()
    OR public.is_company_member(company_id)
  );

DROP POLICY IF EXISTS "projects_admin_manage" ON public.projects;
CREATE POLICY "projects_admin_manage" ON public.projects
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- INVOICES ---
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    public.is_brik_admin()
    OR (public.is_company_member(company_id)
        AND public.has_company_permission(company_id, 'invoices.view'))
  );

DROP POLICY IF EXISTS "invoices_admin_manage" ON public.invoices;
CREATE POLICY "invoices_admin_manage" ON public.invoices
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- SERVICE_CATEGORIES (public read, admin write) ---
DROP POLICY IF EXISTS "service_categories_select" ON public.service_categories;
CREATE POLICY "service_categories_select" ON public.service_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "service_categories_admin_manage" ON public.service_categories;
CREATE POLICY "service_categories_admin_manage" ON public.service_categories
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- SERVICES (public read, admin write) ---
DROP POLICY IF EXISTS "services_select" ON public.services;
CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "services_admin_manage" ON public.services;
CREATE POLICY "services_admin_manage" ON public.services
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- COMPANY_SERVICES ---
DROP POLICY IF EXISTS "company_services_select" ON public.company_services;
CREATE POLICY "company_services_select" ON public.company_services
  FOR SELECT USING (
    public.is_brik_admin()
    OR public.is_company_member(company_id)
  );

DROP POLICY IF EXISTS "company_services_admin_manage" ON public.company_services;
CREATE POLICY "company_services_admin_manage" ON public.company_services
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- PROPOSALS (was admin-only, now clients can read their own) ---
DROP POLICY IF EXISTS "Admin full access to proposals" ON public.proposals;
DROP POLICY IF EXISTS "proposals_admin_manage" ON public.proposals;
CREATE POLICY "proposals_admin_manage" ON public.proposals
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "proposals_select" ON public.proposals
  FOR SELECT USING (
    public.is_company_member(company_id)
    AND public.has_company_permission(company_id, 'proposals.view')
  );

-- --- PROPOSAL_ITEMS ---
DROP POLICY IF EXISTS "Admin full access to proposal_items" ON public.proposal_items;
DROP POLICY IF EXISTS "proposal_items_admin_manage" ON public.proposal_items;
CREATE POLICY "proposal_items_admin_manage" ON public.proposal_items
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "proposal_items_select" ON public.proposal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_items.proposal_id
        AND public.is_company_member(p.company_id)
        AND public.has_company_permission(p.company_id, 'proposals.view')
    )
  );

-- --- REPORT_SETS (was admin-only, now clients can read their own) ---
DROP POLICY IF EXISTS "Admin full access to report_sets" ON public.report_sets;
DROP POLICY IF EXISTS "report_sets_admin_manage" ON public.report_sets;
CREATE POLICY "report_sets_admin_manage" ON public.report_sets
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "report_sets_select" ON public.report_sets
  FOR SELECT USING (
    public.is_company_member(company_id)
    AND public.has_company_permission(company_id, 'reports.view')
  );

-- --- REPORTS ---
DROP POLICY IF EXISTS "Admin full access to reports" ON public.reports;
DROP POLICY IF EXISTS "reports_admin_manage" ON public.reports;
CREATE POLICY "reports_admin_manage" ON public.reports
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "reports_select" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.report_sets rs
      WHERE rs.id = reports.report_set_id
        AND public.is_company_member(rs.company_id)
        AND public.has_company_permission(rs.company_id, 'reports.view')
    )
  );

-- --- REPORT_ITEMS ---
DROP POLICY IF EXISTS "Admin full access to report_items" ON public.report_items;
DROP POLICY IF EXISTS "report_items_admin_manage" ON public.report_items;
CREATE POLICY "report_items_admin_manage" ON public.report_items
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "report_items_select" ON public.report_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.report_sets rs ON rs.id = r.report_set_id
      WHERE r.id = report_items.report_id
        AND public.is_company_member(rs.company_id)
        AND public.has_company_permission(rs.company_id, 'reports.view')
    )
  );

-- --- AGREEMENT_TEMPLATES (public read for authenticated, admin write) ---
DROP POLICY IF EXISTS "Admin full access to agreement_templates" ON public.agreement_templates;
DROP POLICY IF EXISTS "agreement_templates_admin_manage" ON public.agreement_templates;

CREATE POLICY "agreement_templates_select" ON public.agreement_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "agreement_templates_admin_manage" ON public.agreement_templates
  FOR ALL USING (
    public.is_brik_admin()
  );

-- --- AGREEMENTS (was admin-only, now clients can read their own) ---
DROP POLICY IF EXISTS "Admin full access to agreements" ON public.agreements;
DROP POLICY IF EXISTS "agreements_admin_manage" ON public.agreements;
CREATE POLICY "agreements_admin_manage" ON public.agreements
  FOR ALL USING (
    public.is_brik_admin()
  );

CREATE POLICY "agreements_select" ON public.agreements
  FOR SELECT USING (
    public.is_company_member(company_id)
    AND public.has_company_permission(company_id, 'agreements.view')
  );

-- --- EMAIL_LOG (admin only, unchanged) ---
DROP POLICY IF EXISTS "email_log_admin_only" ON public.email_log;
CREATE POLICY "email_log_admin_only" ON public.email_log
  FOR ALL USING (
    public.is_brik_admin()
  );

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE public.company_users IS
  'Junction table: user membership in companies with role-based permissions. Roles: owner, admin, member, viewer.';
COMMENT ON COLUMN public.company_users.role IS
  'Company-level role. owner=full control+team mgmt, admin=operations, member=projects+services, viewer=read-only.';
