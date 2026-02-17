-- ============================================
-- Migration 00007: Add slug to projects + expand status constraint
-- Adds URL-friendly slugs and includes 'not_started' status
-- ============================================

-- 1. ADD SLUG COLUMN
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from existing names (same pattern as 00004)
UPDATE public.projects
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

-- Trim leading/trailing hyphens
UPDATE public.projects
SET slug = regexp_replace(slug, '^-|-$', '', 'g')
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Make NOT NULL + UNIQUE
ALTER TABLE public.projects ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_slug_key') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);


-- 2. EXPAND STATUS CONSTRAINT (add 'not_started')
-- Drop existing check constraint and replace with expanded one
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('not_started', 'active', 'completed', 'on_hold', 'cancelled'));


-- ============================================
-- VERIFY
-- ============================================
SELECT name, slug, status FROM public.projects ORDER BY name;
