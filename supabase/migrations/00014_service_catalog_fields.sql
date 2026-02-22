-- Migration: 00014_service_catalog_fields
-- Add proposal/agreement copy and catalog metadata to services table
-- These fields sync from the Notion Services Catalog and are used at runtime
-- for proposal generation, agreement merge tags, and admin views.
--
-- Notion source: Services Catalog (1ba97d34-ed28-8058-9fe7-d0db0b7dbf17)

-- ============================================
-- 1. PROPOSAL & AGREEMENT COPY (critical — used in document generation)
-- ============================================

-- Short description used in proposal line items
ALTER TABLE public.services ADD COLUMN proposal_copy text;

-- Full contract line (name + price + description) for agreement {{services_table}} merge tag
ALTER TABLE public.services ADD COLUMN contract_copy text;

-- What's included in the service (bullet-pointed scope)
ALTER TABLE public.services ADD COLUMN included_scope text;

-- What's NOT included (exclusions and overage pricing)
ALTER TABLE public.services ADD COLUMN not_included text;

-- Estimated delivery time (e.g., "1-2 weeks", "2 days")
ALTER TABLE public.services ADD COLUMN projected_timeline text;

-- ============================================
-- 2. CATALOG METADATA (used for admin views and bundle logic)
-- ============================================

-- Single Service vs Bundled (bundles contain multiple sub-services)
ALTER TABLE public.services ADD COLUMN offering_structure text
  CHECK (offering_structure IN ('single_service', 'bundled'));

-- Internal complexity rating for ops/staffing
ALTER TABLE public.services ADD COLUMN operational_complexity text
  CHECK (operational_complexity IN ('low', 'medium', 'high'));

-- ============================================
-- 3. STRIPE SYNC TRACKING (admin convenience)
-- ============================================

-- Direct link to Stripe dashboard product page
ALTER TABLE public.services ADD COLUMN stripe_product_url text;

-- Sync status tracking
ALTER TABLE public.services ADD COLUMN stripe_sync_status text
  CHECK (stripe_sync_status IN ('created', 'not_created'))
  DEFAULT 'not_created';

-- When Stripe was last synced
ALTER TABLE public.services ADD COLUMN stripe_last_synced timestamptz;

-- ============================================
-- 4. ADD COMMENTS for documentation
-- ============================================
COMMENT ON COLUMN public.services.proposal_copy IS 'Short description for proposal line items. Synced from Notion Services Catalog.';
COMMENT ON COLUMN public.services.contract_copy IS 'Full contract line (name + price + description) for agreement generation. Synced from Notion.';
COMMENT ON COLUMN public.services.included_scope IS 'Bullet-pointed scope of what is included. Synced from Notion.';
COMMENT ON COLUMN public.services.not_included IS 'Exclusions and overage pricing. Synced from Notion.';
COMMENT ON COLUMN public.services.projected_timeline IS 'Estimated delivery time. Synced from Notion.';
COMMENT ON COLUMN public.services.offering_structure IS 'single_service or bundled. Bundled services contain sub-services.';
COMMENT ON COLUMN public.services.operational_complexity IS 'Internal ops metric: low, medium, high.';
