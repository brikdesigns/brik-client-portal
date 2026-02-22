-- Migration: 00015_companies_contacts
-- Rename clients → companies, create contacts table, add lead/client type
--
-- PostgreSQL handles table/column renames by OID, so existing RLS policies,
-- FK constraints, and indexes continue to work after rename. We rename
-- policies and indexes for clarity.

-- ============================================
-- 1. RENAME TABLES
-- ============================================
ALTER TABLE public.clients RENAME TO companies;
ALTER TABLE public.client_users RENAME TO company_users;
ALTER TABLE public.client_services RENAME TO company_services;

-- ============================================
-- 2. RENAME FK COLUMNS on dependent tables
-- ============================================
ALTER TABLE public.projects RENAME COLUMN client_id TO company_id;
ALTER TABLE public.invoices RENAME COLUMN client_id TO company_id;
ALTER TABLE public.proposals RENAME COLUMN client_id TO company_id;
ALTER TABLE public.agreements RENAME COLUMN client_id TO company_id;
ALTER TABLE public.report_sets RENAME COLUMN client_id TO company_id;
ALTER TABLE public.company_users RENAME COLUMN client_id TO company_id;
ALTER TABLE public.company_services RENAME COLUMN client_id TO company_id;
ALTER TABLE public.profiles RENAME COLUMN client_id TO company_id;

-- ============================================
-- 3. ADD TYPE COLUMN to companies
-- ============================================
ALTER TABLE public.companies ADD COLUMN type text NOT NULL DEFAULT 'client'
  CHECK (type IN ('lead', 'client'));

-- All existing records are clients
UPDATE public.companies SET type = 'client';

-- Add index for type filtering
CREATE INDEX idx_companies_type ON public.companies(type);

-- ============================================
-- 4. EXPAND STATUS CONSTRAINT
-- ============================================
-- Drop the old constraint (added in 00010_prospect_status.sql)
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS clients_status_check;
-- Also try the original name from 00001 in case it was never renamed
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS check_status;

-- Add expanded constraint with lead + client statuses
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
  CHECK (status IN (
    'new', 'working', 'qualified', 'unqualified',  -- lead statuses
    'prospect', 'active', 'inactive', 'archived'    -- client statuses
  ));

-- ============================================
-- 5. CREATE CONTACTS TABLE
-- ============================================
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  title text,
  role text NOT NULL DEFAULT 'client'
    CHECK (role IN ('admin', 'client', 'manager')),
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id) WHERE user_id IS NOT NULL;

-- Trigger
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = contacts.company_id
        AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "contacts_admin_manage" ON public.contacts
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 6. MIGRATE CONTACT DATA from companies to contacts
-- ============================================
-- Create a contact record for each company that has contact_name populated
INSERT INTO public.contacts (company_id, full_name, email, user_id, is_primary, role)
SELECT
  id AS company_id,
  contact_name AS full_name,
  contact_email AS email,
  contact_id AS user_id,
  true AS is_primary,
  'client' AS role
FROM public.companies
WHERE contact_name IS NOT NULL AND contact_name != '';

-- Also create admin contacts for Nick at Brik Designs
INSERT INTO public.contacts (company_id, full_name, email, user_id, is_primary, role)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Nick Stanerson',
  'nick@brikdesigns.com',
  '4c444a10-8cd6-49e2-8f31-434a3c51e8d1',
  true,
  'admin'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. RENAME POLICIES for clarity
-- (PostgreSQL handles OID-based resolution automatically,
--  but names should reflect new table names)
-- ============================================

-- companies table (was clients)
ALTER POLICY "clients_select" ON public.companies RENAME TO "companies_select";
ALTER POLICY "clients_admin_manage" ON public.companies RENAME TO "companies_admin_manage";

-- company_users table (was client_users)
ALTER POLICY "client_users_select" ON public.company_users RENAME TO "company_users_select";
ALTER POLICY "client_users_admin_manage" ON public.company_users RENAME TO "company_users_admin_manage";

-- company_services table (was client_services)
ALTER POLICY "client_services_select" ON public.company_services RENAME TO "company_services_select";
ALTER POLICY "client_services_admin_manage" ON public.company_services RENAME TO "company_services_admin_manage";

-- ============================================
-- 8. RENAME INDEXES for clarity (cosmetic)
-- ============================================
ALTER INDEX IF EXISTS idx_clients_status RENAME TO idx_companies_status;
ALTER INDEX IF EXISTS idx_clients_slug RENAME TO idx_companies_slug;
ALTER INDEX IF EXISTS clients_contact_id_idx RENAME TO companies_contact_id_idx;
ALTER INDEX IF EXISTS idx_profiles_client_id RENAME TO idx_profiles_company_id;
ALTER INDEX IF EXISTS idx_projects_client_id RENAME TO idx_projects_company_id;
ALTER INDEX IF EXISTS idx_invoices_client_id RENAME TO idx_invoices_company_id;
ALTER INDEX IF EXISTS idx_client_users_user_id RENAME TO idx_company_users_user_id;
ALTER INDEX IF EXISTS idx_client_users_client_id RENAME TO idx_company_users_company_id;
ALTER INDEX IF EXISTS idx_client_services_client_id RENAME TO idx_company_services_company_id;
ALTER INDEX IF EXISTS idx_client_services_service_id RENAME TO idx_company_services_service_id;
ALTER INDEX IF EXISTS idx_proposals_client_id RENAME TO idx_proposals_company_id;
ALTER INDEX IF EXISTS idx_agreements_client_id RENAME TO idx_agreements_company_id;
ALTER INDEX IF EXISTS idx_report_sets_client RENAME TO idx_report_sets_company;

-- ============================================
-- 9. RENAME TRIGGERS for clarity (cosmetic)
-- ============================================
ALTER TRIGGER clients_updated_at ON public.companies RENAME TO companies_updated_at;
ALTER TRIGGER client_services_updated_at ON public.company_services RENAME TO company_services_updated_at;

-- ============================================
-- 10. ADD COMMENTS
-- ============================================
COMMENT ON TABLE public.companies IS 'Organizations — leads or clients. Renamed from clients in migration 00015.';
COMMENT ON COLUMN public.companies.type IS 'lead or client. Leads flow through qualification before becoming client prospects.';
COMMENT ON TABLE public.contacts IS 'People at companies. Optional portal access via user_id link to auth.users.';
COMMENT ON COLUMN public.contacts.role IS 'Portal access level: admin (full), manager (limited admin), client (dashboard only).';
COMMENT ON COLUMN public.contacts.user_id IS 'Nullable FK to auth.users. When set, this contact has portal login access.';
COMMENT ON COLUMN public.contacts.is_primary IS 'Primary contact for the company — used in proposals and agreements.';
