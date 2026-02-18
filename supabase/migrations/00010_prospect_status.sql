-- Migration: 00010_prospect_status
-- Add 'prospect' to allowed client statuses and make it the default
-- New clients created via Add Client form are prospects until they sign an invoice

ALTER TABLE clients DROP CONSTRAINT clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status = ANY (ARRAY['prospect'::text, 'active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE clients ALTER COLUMN status SET DEFAULT 'prospect';
