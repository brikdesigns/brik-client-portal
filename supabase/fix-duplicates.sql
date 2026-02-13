-- Fix: Remove duplicate services created by running apply-all.sql twice
-- Run this in Supabase SQL Editor, then re-run apply-all.sql

-- 1. Delete duplicate client_services (keep oldest by created_at)
DELETE FROM public.client_services
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, service_id) id
  FROM public.client_services
  ORDER BY client_id, service_id, created_at ASC
);

-- 2. Delete duplicate services (keep oldest by created_at per name)
DELETE FROM public.services
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM public.services
  ORDER BY name, created_at ASC
);

-- 3. Add unique constraint on services.name to prevent this in the future
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_name_key'
  ) THEN
    ALTER TABLE public.services ADD CONSTRAINT services_name_key UNIQUE (name);
  END IF;
END $$;

-- 4. Delete duplicate invoices (keep oldest per client_id + description + amount_cents)
DELETE FROM public.invoices
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, description, amount_cents) id
  FROM public.invoices
  ORDER BY client_id, description, amount_cents, created_at ASC
);

-- 5. Delete duplicate projects (keep oldest per client_id + name)
DELETE FROM public.projects
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, name) id
  FROM public.projects
  ORDER BY client_id, name, created_at ASC
);

-- Verify clean state
SELECT 'service_categories' AS table_name, count(*) FROM public.service_categories
UNION ALL SELECT 'services', count(*) FROM public.services
UNION ALL SELECT 'client_services', count(*) FROM public.client_services
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'projects', count(*) FROM public.projects
UNION ALL SELECT 'invoices', count(*) FROM public.invoices;
