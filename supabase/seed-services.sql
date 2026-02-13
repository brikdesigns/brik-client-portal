-- Seed service categories
-- Run after 00002_services.sql migration
-- 5 categories matching brikdesigns.com service sections

INSERT INTO public.service_categories (name, slug, color_token, sort_order) VALUES
  ('Brand Design', 'brand', 'yellow', 1),
  ('Marketing Design', 'marketing', 'green', 2),
  ('Information Design', 'information', 'blue', 3),
  ('Product Design', 'product', 'purple', 4),
  ('Service Design', 'service', 'orange', 5)
ON CONFLICT (slug) DO NOTHING;
