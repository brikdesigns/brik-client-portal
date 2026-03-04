-- Add company_id to email_log for per-client email history
ALTER TABLE public.email_log
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX idx_email_log_company_id ON public.email_log(company_id)
  WHERE company_id IS NOT NULL;
