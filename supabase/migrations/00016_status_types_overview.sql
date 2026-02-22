-- Migration: 00016_status_types_overview
-- 1. Add 'prospect' to company type (Lead → Prospect → Client lifecycle)
-- 2. Replace statuses with unified set (not_started, needs_qualified, needs_proposal, active, not_active)
-- 3. Add overview metadata columns (location, contact, opportunities/GHL)
-- 4. Migrate existing data to new statuses/types

BEGIN;

-- ============================================
-- 1. DROP OLD CONSTRAINTS (before data migration)
-- ============================================
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_type_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;

-- ============================================
-- 2. MIGRATE EXISTING DATA to new statuses/types
--    (must happen before new CHECK constraints)
-- ============================================

-- Lead statuses → new statuses
UPDATE public.companies SET status = 'needs_qualified' WHERE type = 'lead' AND status = 'new';
UPDATE public.companies SET status = 'needs_qualified' WHERE type = 'lead' AND status = 'working';
UPDATE public.companies SET status = 'needs_proposal'  WHERE type = 'lead' AND status = 'qualified';
UPDATE public.companies SET status = 'not_active'      WHERE type = 'lead' AND status = 'unqualified';

-- Client status 'prospect' → promote to type 'prospect'
UPDATE public.companies SET type = 'prospect', status = 'needs_proposal'
  WHERE type = 'client' AND status = 'prospect';

-- Client statuses → new statuses
UPDATE public.companies SET status = 'not_active' WHERE type = 'client' AND status = 'inactive';
UPDATE public.companies SET status = 'not_active' WHERE type = 'client' AND status = 'archived';
-- 'active' stays 'active' (no change needed)

-- ============================================
-- 3. ADD NEW CONSTRAINTS
-- ============================================
ALTER TABLE public.companies ADD CONSTRAINT companies_type_check
  CHECK (type IN ('lead', 'prospect', 'client'));

ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
  CHECK (status IN (
    'not_started',
    'needs_qualified',
    'needs_proposal',
    'active',
    'not_active'
  ));

-- ============================================
-- 4. ADD OVERVIEW METADATA COLUMNS
-- ============================================

-- Location (granular address components)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';

-- Contact
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS domain_hosted text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS other_marketing_company text;

-- Opportunities / GoHighLevel fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pipeline text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pipeline_stage text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS opportunity_owner text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS followers text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS introduction_date date;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ghl_contact_id text;

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON COLUMN public.companies.type IS 'lead → prospect → client lifecycle. Qualify promotes lead to prospect.';
COMMENT ON COLUMN public.companies.status IS 'Unified: not_started, needs_qualified, needs_proposal, active, not_active.';
COMMENT ON COLUMN public.companies.domain_hosted IS 'Where the company domain is hosted (e.g., GoDaddy, SiteGround).';
COMMENT ON COLUMN public.companies.referred_by IS 'Who referred this company (manually entered).';
COMMENT ON COLUMN public.companies.pipeline IS 'GoHighLevel pipeline name.';
COMMENT ON COLUMN public.companies.pipeline_stage IS 'GoHighLevel pipeline stage.';
COMMENT ON COLUMN public.companies.opportunity_owner IS 'GoHighLevel opportunity owner.';
COMMENT ON COLUMN public.companies.ghl_contact_id IS 'GoHighLevel contact ID for bidirectional sync.';

COMMIT;
