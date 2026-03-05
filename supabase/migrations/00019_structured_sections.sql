-- Migration: 00019_structured_sections
-- Update sections JSONB comment to document new structured fields
-- No schema change needed — JSONB already accepts arbitrary keys per section.
-- This migration documents the new optional fields added to section objects.

BEGIN;

-- Update comment to document structured section data
COMMENT ON COLUMN public.proposals.sections IS
  'JSONB array of proposal sections. Each element has: type, title, content (markdown), sort_order. '
  'Scope sections may also include scope_items: [{service_id, service_name, category_slug, included[], not_included[], timeline}]. '
  'Timeline sections may also include timeline_phases: [{phase_label, deliverables[]}].';

-- Add service category slug join support for fee summary
-- proposal_items.service_id already has FK to services
-- services.category_id already has FK to service_categories
-- No new columns needed — query joins handle this

COMMIT;
