-- Add needs_signature to company status CHECK constraint
-- Used when a proposal has been sent and awaits prospect's signature

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check
  CHECK (status IN ('not_started', 'needs_qualified', 'needs_proposal', 'needs_signature', 'active', 'not_active'));
