-- ============================================
-- APPLY ALL: Migration + Seed (run in Supabase SQL Editor)
-- Combines: 00002_services.sql + seed-services.sql + seed-test-data.sql
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================

-- ============================================
-- MIGRATION: Service tables
-- ============================================

-- 1. SERVICE CATEGORIES
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  color_token text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_categories enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_categories' AND policyname = 'service_categories_select') THEN
    CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_categories' AND policyname = 'service_categories_admin_manage') THEN
    CREATE POLICY "service_categories_admin_manage" ON public.service_categories FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- 2. SERVICES (with unique name constraint for idempotent seeding)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id),
  name text not null,
  description text,
  service_type text not null default 'one_time' check (service_type in ('one_time', 'recurring', 'add_on')),
  billing_frequency text check (billing_frequency in ('one_time', 'monthly')),
  base_price_cents integer,
  stripe_product_id text,
  stripe_price_id text,
  active boolean not null default true,
  notion_page_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add unique constraint on name (safe if already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_name_key') THEN
    ALTER TABLE public.services ADD CONSTRAINT services_name_key UNIQUE (name);
  END IF;
END $$;

alter table public.services enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_select') THEN
    CREATE POLICY "services_select" ON public.services FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_admin_manage') THEN
    CREATE POLICY "services_admin_manage" ON public.services FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- 3. CLIENT SERVICES
create table if not exists public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'completed')),
  started_at timestamptz default now(),
  cancelled_at timestamptz,
  stripe_subscription_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, service_id)
);

alter table public.client_services enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_services' AND policyname = 'client_services_select') THEN
    CREATE POLICY "client_services_select" ON public.client_services FOR SELECT USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      OR client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_services' AND policyname = 'client_services_admin_manage') THEN
    CREATE POLICY "client_services_admin_manage" ON public.client_services FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- 4. TRIGGERS (safe: drop + recreate)
DROP TRIGGER IF EXISTS service_categories_updated_at ON public.service_categories;
CREATE TRIGGER service_categories_updated_at BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS client_services_updated_at ON public.client_services;
CREATE TRIGGER client_services_updated_at BEFORE UPDATE ON public.client_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON public.client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON public.client_services(status);


-- ============================================
-- SEED: Service categories
-- ============================================
INSERT INTO public.service_categories (name, slug, color_token, sort_order) VALUES
  ('Brand Design', 'brand', 'yellow', 1),
  ('Marketing Design', 'marketing', 'green', 2),
  ('Information Design', 'information', 'blue', 3),
  ('Product Design', 'product', 'purple', 4),
  ('Service Design', 'service', 'orange', 5)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- SEED: Sample services (10 across categories)
-- ============================================
INSERT INTO public.services (name, description, category_id, service_type, billing_frequency, base_price_cents, active, sort_order)
VALUES
  ('Brand Identity Package', 'Complete brand identity including logo, color palette, typography, and brand guidelines.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 750000, true, 1),
  ('Logo Design', 'Custom logo design with 3 concepts and 2 rounds of revisions.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 250000, true, 2),
  ('Brand Guidelines Document', 'Comprehensive brand standards manual for consistent brand application.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 350000, true, 3),
  ('Social Media Management', 'Monthly social media content creation, scheduling, and analytics.', (SELECT id FROM service_categories WHERE slug = 'marketing'), 'recurring', 'monthly', 200000, true, 1),
  ('Email Campaign Design', 'Custom email template design and campaign setup.', (SELECT id FROM service_categories WHERE slug = 'marketing'), 'one_time', 'one_time', 150000, true, 2),
  ('Website Design & Development', 'Custom website design and Webflow development with CMS.', (SELECT id FROM service_categories WHERE slug = 'information'), 'one_time', 'one_time', 1500000, true, 1),
  ('Website Maintenance', 'Monthly website updates, security patches, and content changes.', (SELECT id FROM service_categories WHERE slug = 'information'), 'recurring', 'monthly', 75000, true, 2),
  ('UI/UX Design', 'User interface and experience design for web or mobile applications.', (SELECT id FROM service_categories WHERE slug = 'product'), 'one_time', 'one_time', 1000000, true, 1),
  ('Design System', 'Component library and design token system for consistent product design.', (SELECT id FROM service_categories WHERE slug = 'product'), 'one_time', 'one_time', 2000000, true, 2),
  ('Process Mapping', 'Service blueprint and customer journey mapping workshop.', (SELECT id FROM service_categories WHERE slug = 'service'), 'one_time', 'one_time', 500000, true, 1)
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- SEED: Test client — Acme Corporation
-- ============================================
INSERT INTO public.clients (id, name, status, contact_name, contact_email, website_url, notes)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Acme Corporation',
  'active',
  'Jane Smith',
  'jane@acmecorp.example.com',
  'https://acmecorp.example.com',
  'Demo client for portal testing. Has active services and invoices.'
)
ON CONFLICT (id) DO NOTHING;

-- Assign services to Acme (uses LIMIT 1 per name to avoid subquery ambiguity)
INSERT INTO public.client_services (client_id, service_id, status, started_at, notes)
SELECT 'a0000000-0000-0000-0000-000000000001', s.id, 'active', now() - interval '90 days', NULL
FROM (
  SELECT DISTINCT ON (name) id, name FROM public.services
  WHERE name IN ('Website Design & Development', 'Website Maintenance', 'Social Media Management', 'Brand Identity Package')
  ORDER BY name, created_at ASC
) s
ON CONFLICT (client_id, service_id) DO NOTHING;

-- Mark Brand Identity as completed
UPDATE public.client_services
SET status = 'completed', cancelled_at = now() - interval '30 days'
WHERE client_id = 'a0000000-0000-0000-0000-000000000001'
  AND service_id = (SELECT id FROM public.services WHERE name = 'Brand Identity Package' LIMIT 1)
  AND status = 'active';

-- Projects for Acme
INSERT INTO public.projects (client_id, name, status, description, start_date, end_date)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Redesign', 'active', 'Complete website redesign and Webflow build.', '2025-11-01'::date, NULL::date),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Brand Refresh', 'completed', 'Updated brand identity and guidelines.', '2025-09-15'::date, '2025-12-01'::date),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Q1 Social Campaign', 'active', 'Social media campaign for Q1 2026 product launch.', '2026-01-15'::date, '2026-03-31'::date)
) AS v(client_id, name, status, description, start_date, end_date)
WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.client_id = v.client_id AND p.name = v.name);

-- Invoices for Acme
INSERT INTO public.invoices (client_id, description, amount_cents, currency, status, invoice_date, due_date, paid_at)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Brand Identity Package', 750000, 'usd', 'paid', '2025-09-15'::date, '2025-10-15'::date, '2025-10-10'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Design — Phase 1 deposit', 500000, 'usd', 'paid', '2025-11-01'::date, '2025-11-15'::date, '2025-11-12'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Social Media Management — November', 200000, 'usd', 'paid', '2025-11-01'::date, '2025-11-30'::date, '2025-11-28'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Social Media Management — December', 200000, 'usd', 'paid', '2025-12-01'::date, '2025-12-31'::date, '2025-12-20'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Maintenance — December', 75000, 'usd', 'paid', '2025-12-01'::date, '2025-12-31'::date, '2025-12-22'::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Design — Phase 2', 500000, 'usd', 'open', '2026-01-15'::date, '2026-02-15'::date, NULL::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Social Media Management — January', 200000, 'usd', 'open', '2026-01-01'::date, '2026-01-31'::date, NULL::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Maintenance — January', 75000, 'usd', 'open', '2026-01-01'::date, '2026-01-31'::date, NULL::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Social Media Management — February', 200000, 'usd', 'draft', '2026-02-01'::date, '2026-02-28'::date, NULL::timestamptz),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Website Design — Final payment', 500000, 'usd', 'draft', NULL::date, NULL::date, NULL::timestamptz)
) AS v(client_id, description, amount_cents, currency, status, invoice_date, due_date, paid_at)
WHERE NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.client_id = v.client_id AND i.description = v.description);


-- ============================================
-- SEED: Test client — Pinnacle Labs
-- ============================================
INSERT INTO public.clients (id, name, status, contact_name, contact_email, website_url, notes)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Pinnacle Labs',
  'active',
  'Marcus Chen',
  'marcus@pinnaclelabs.example.com',
  'https://pinnaclelabs.example.com',
  'Second demo client. Early engagement — just started.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.client_services (client_id, service_id, status, started_at)
SELECT 'a0000000-0000-0000-0000-000000000002', s.id, 'active', now() - interval '14 days'
FROM (
  SELECT DISTINCT ON (name) id, name FROM public.services
  WHERE name IN ('UI/UX Design', 'Logo Design')
  ORDER BY name, created_at ASC
) s
ON CONFLICT (client_id, service_id) DO NOTHING;

INSERT INTO public.projects (client_id, name, status, description, start_date)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Mobile App Design', 'active', 'UI/UX design for iOS and Android app.', '2026-02-01'::date)
) AS v(client_id, name, status, description, start_date)
WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.client_id = v.client_id AND p.name = v.name);

INSERT INTO public.invoices (client_id, description, amount_cents, currency, status, invoice_date, due_date)
SELECT * FROM (VALUES
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'UI/UX Design — Discovery phase', 350000, 'usd', 'open', '2026-02-01'::date, '2026-03-01'::date),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Logo Design — Deposit', 125000, 'usd', 'draft', NULL::date, NULL::date)
) AS v(client_id, description, amount_cents, currency, status, invoice_date, due_date)
WHERE NOT EXISTS (SELECT 1 FROM public.invoices i WHERE i.client_id = v.client_id AND i.description = v.description);


-- ============================================
-- DONE! Verify:
-- ============================================
SELECT 'service_categories' AS table_name, count(*) FROM public.service_categories
UNION ALL SELECT 'services', count(*) FROM public.services
UNION ALL SELECT 'client_services', count(*) FROM public.client_services
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'projects', count(*) FROM public.projects
UNION ALL SELECT 'invoices', count(*) FROM public.invoices;
