-- ============================================
-- Migration 00004: Add URL slugs to services and clients
-- Generates human-readable slugs from names for clean URLs
-- e.g., /admin/services/brand-identity-package instead of /admin/services/c2f5ec8a-...
-- ============================================

-- 1. ADD SLUG TO SERVICES
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from existing names: lowercase, replace non-alphanumeric with hyphens, trim
UPDATE public.services
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- remove special chars
      '\s+', '-', 'g'                                       -- spaces to hyphens
    ),
    '-+', '-', 'g'                                          -- collapse multiple hyphens
  )
)
WHERE slug IS NULL;

-- Trim trailing hyphens
UPDATE public.services
SET slug = regexp_replace(slug, '^-|-$', '', 'g')
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Make NOT NULL + UNIQUE
ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_slug_key') THEN
    ALTER TABLE public.services ADD CONSTRAINT services_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);


-- 2. ADD SLUG TO CLIENTS
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from existing names
UPDATE public.clients
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

UPDATE public.clients
SET slug = regexp_replace(slug, '^-|-$', '', 'g')
WHERE slug LIKE '-%' OR slug LIKE '%-';

ALTER TABLE public.clients ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_slug_key') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);


-- ============================================
-- VERIFY
-- ============================================
SELECT table_name, name, slug FROM (
  SELECT 'services' AS table_name, name, slug FROM public.services
  UNION ALL
  SELECT 'clients', name, slug FROM public.clients
) t ORDER BY table_name, name;
