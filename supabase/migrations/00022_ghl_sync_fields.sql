-- Add fields synced from GoHighLevel contacts/opportunities
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ghl_tags text[];
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ghl_source text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ghl_opportunity_value_cents integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ghl_last_synced timestamptz;

COMMENT ON COLUMN public.companies.ghl_tags IS 'Tags from GoHighLevel contact record.';
COMMENT ON COLUMN public.companies.ghl_source IS 'Lead source from GoHighLevel (e.g. referral, web, ads).';
COMMENT ON COLUMN public.companies.ghl_opportunity_value_cents IS 'Monetary value of the primary opportunity in cents.';
COMMENT ON COLUMN public.companies.ghl_last_synced IS 'Timestamp of last successful sync from GoHighLevel.';
