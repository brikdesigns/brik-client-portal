-- Migration 00031: Auto-assign services on proposal signing
--
-- When a prospect signs a proposal, create company_services records
-- for each proposal_item linked to a service catalog entry.
-- New status 'pending' gives admin a review gate before activation.

-- 1. Add 'pending' to company_services status check constraint
alter table public.company_services
  drop constraint if exists client_services_status_check,
  drop constraint if exists company_services_status_check;

alter table public.company_services
  add constraint company_services_status_check
  check (status in ('pending', 'active', 'paused', 'cancelled', 'completed'));

-- 2. Add proposal_id FK to trace which proposal created the assignment
alter table public.company_services
  add column if not exists proposal_id uuid references public.proposals(id) on delete set null;

-- 3. Index for fast lookup by proposal
create index if not exists idx_company_services_proposal_id
  on public.company_services(proposal_id)
  where proposal_id is not null;
