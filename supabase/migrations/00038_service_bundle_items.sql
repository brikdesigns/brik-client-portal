-- Service bundle composition: tracks which child services are included in a bundled parent service.
-- Mirrors the "Services Included" relation from Notion Service Catalog.
-- Only applies to services with offering_structure = 'bundled'.

CREATE TABLE IF NOT EXISTS public.service_bundle_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  child_service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (parent_service_id, child_service_id),
  CHECK (parent_service_id != child_service_id)
);

-- Index for fast lookups: "what's included in this bundle?"
CREATE INDEX idx_bundle_items_parent ON public.service_bundle_items(parent_service_id);

-- RLS: same pattern as services — admin full access, authenticated read
ALTER TABLE public.service_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bundle items"
  ON public.service_bundle_items FOR ALL
  USING (public.is_brik_admin());

CREATE POLICY "Authenticated users can read bundle items"
  ON public.service_bundle_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Record migration
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('00038', 'service_bundle_items')
ON CONFLICT DO NOTHING;
