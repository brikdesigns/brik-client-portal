-- Seed test data for development/demo
-- Run AFTER both migrations (00001 + 00002) and seed-services.sql
-- Creates: 1 test client, sample services, invoices, and assignments
--
-- To apply: paste into Supabase Dashboard → SQL Editor → Run

-- ============================================
-- 1. Ensure service categories exist
-- ============================================
INSERT INTO public.service_categories (name, slug, color_token, sort_order) VALUES
  ('Brand Design', 'brand', 'yellow', 1),
  ('Marketing Design', 'marketing', 'green', 2),
  ('Information Design', 'information', 'blue', 3),
  ('Product Design', 'product', 'purple', 4),
  ('Service Design', 'service', 'orange', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. Sample services (10 services across categories)
-- ============================================
INSERT INTO public.services (name, description, category_id, service_type, billing_frequency, base_price_cents, active, sort_order)
VALUES
  -- Brand Design
  ('Brand Identity Package', 'Complete brand identity including logo, color palette, typography, and brand guidelines.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 750000, true, 1),
  ('Logo Design', 'Custom logo design with 3 concepts and 2 rounds of revisions.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 250000, true, 2),
  ('Brand Guidelines Document', 'Comprehensive brand standards manual for consistent brand application.', (SELECT id FROM service_categories WHERE slug = 'brand'), 'one_time', 'one_time', 350000, true, 3),
  -- Marketing Design
  ('Social Media Management', 'Monthly social media content creation, scheduling, and analytics.', (SELECT id FROM service_categories WHERE slug = 'marketing'), 'recurring', 'monthly', 200000, true, 1),
  ('Email Campaign Design', 'Custom email template design and campaign setup.', (SELECT id FROM service_categories WHERE slug = 'marketing'), 'one_time', 'one_time', 150000, true, 2),
  -- Information Design
  ('Website Design & Development', 'Custom website design and Webflow development with CMS.', (SELECT id FROM service_categories WHERE slug = 'information'), 'one_time', 'one_time', 1500000, true, 1),
  ('Website Maintenance', 'Monthly website updates, security patches, and content changes.', (SELECT id FROM service_categories WHERE slug = 'information'), 'recurring', 'monthly', 75000, true, 2),
  -- Product Design
  ('UI/UX Design', 'User interface and experience design for web or mobile applications.', (SELECT id FROM service_categories WHERE slug = 'product'), 'one_time', 'one_time', 1000000, true, 1),
  ('Design System', 'Component library and design token system for consistent product design.', (SELECT id FROM service_categories WHERE slug = 'product'), 'one_time', 'one_time', 2000000, true, 2),
  -- Service Design
  ('Process Mapping', 'Service blueprint and customer journey mapping workshop.', (SELECT id FROM service_categories WHERE slug = 'service'), 'one_time', 'one_time', 500000, true, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Test client: Acme Corp
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

-- ============================================
-- 4. Assign services to Acme Corp
-- ============================================
INSERT INTO public.client_services (client_id, service_id, status, started_at, notes)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  s.id,
  'active',
  now() - interval '90 days',
  NULL
FROM public.services s
WHERE s.name IN ('Website Design & Development', 'Website Maintenance', 'Social Media Management', 'Brand Identity Package')
ON CONFLICT (client_id, service_id) DO NOTHING;

-- Mark Brand Identity Package as completed
UPDATE public.client_services
SET status = 'completed', cancelled_at = now() - interval '30 days'
WHERE client_id = 'a0000000-0000-0000-0000-000000000001'
  AND service_id = (SELECT id FROM public.services WHERE name = 'Brand Identity Package')
  AND status = 'active';

-- ============================================
-- 5. Projects for Acme Corp
-- ============================================
INSERT INTO public.projects (client_id, name, status, description, start_date, end_date) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Website Redesign', 'active', 'Complete website redesign and Webflow build.', '2025-11-01', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'Brand Refresh', 'completed', 'Updated brand identity and guidelines.', '2025-09-15', '2025-12-01'),
  ('a0000000-0000-0000-0000-000000000001', 'Q1 Social Campaign', 'active', 'Social media campaign for Q1 2026 product launch.', '2026-01-15', '2026-03-31')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. Invoices for Acme Corp
-- ============================================
INSERT INTO public.invoices (client_id, description, amount_cents, currency, status, invoice_date, due_date, paid_at) VALUES
  -- Paid invoices
  ('a0000000-0000-0000-0000-000000000001', 'Brand Identity Package', 750000, 'usd', 'paid', '2025-09-15', '2025-10-15', '2025-10-10'),
  ('a0000000-0000-0000-0000-000000000001', 'Website Design — Phase 1 deposit', 500000, 'usd', 'paid', '2025-11-01', '2025-11-15', '2025-11-12'),
  ('a0000000-0000-0000-0000-000000000001', 'Social Media Management — November', 200000, 'usd', 'paid', '2025-11-01', '2025-11-30', '2025-11-28'),
  ('a0000000-0000-0000-0000-000000000001', 'Social Media Management — December', 200000, 'usd', 'paid', '2025-12-01', '2025-12-31', '2025-12-20'),
  ('a0000000-0000-0000-0000-000000000001', 'Website Maintenance — December', 75000, 'usd', 'paid', '2025-12-01', '2025-12-31', '2025-12-22'),
  -- Open invoices
  ('a0000000-0000-0000-0000-000000000001', 'Website Design — Phase 2', 500000, 'usd', 'open', '2026-01-15', '2026-02-15', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'Social Media Management — January', 200000, 'usd', 'open', '2026-01-01', '2026-01-31', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'Website Maintenance — January', 75000, 'usd', 'open', '2026-01-01', '2026-01-31', NULL),
  -- Draft invoice
  ('a0000000-0000-0000-0000-000000000001', 'Social Media Management — February', 200000, 'usd', 'draft', '2026-02-01', '2026-02-28', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'Website Design — Final payment', 500000, 'usd', 'draft', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. Second test client: Pinnacle Labs
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

-- Assign services to Pinnacle Labs
INSERT INTO public.client_services (client_id, service_id, status, started_at)
SELECT
  'a0000000-0000-0000-0000-000000000002',
  s.id,
  'active',
  now() - interval '14 days'
FROM public.services s
WHERE s.name IN ('UI/UX Design', 'Logo Design')
ON CONFLICT (client_id, service_id) DO NOTHING;

-- Projects for Pinnacle Labs
INSERT INTO public.projects (client_id, name, status, description, start_date) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'Mobile App Design', 'active', 'UI/UX design for iOS and Android app.', '2026-02-01')
ON CONFLICT DO NOTHING;

-- Invoices for Pinnacle Labs
INSERT INTO public.invoices (client_id, description, amount_cents, currency, status, invoice_date, due_date) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'UI/UX Design — Discovery phase', 350000, 'usd', 'open', '2026-02-01', '2026-03-01'),
  ('a0000000-0000-0000-0000-000000000002', 'Logo Design — Deposit', 125000, 'usd', 'draft', NULL, NULL)
ON CONFLICT DO NOTHING;
