-- Migration 00032: Rename proposal status 'accepted' → 'signed'
--
-- The prospect experience now uses "Sign" language (ESIGN Act compliance).
-- Drop constraint first (prod may already have 'signed' rows from updated code),
-- then migrate data, then add the new constraint.

-- 1. Drop the old constraint first (safe — allows any value temporarily)
alter table public.proposals
  drop constraint if exists proposals_status_check;

-- 2. Update existing data
update public.proposals
  set status = 'signed'
  where status = 'accepted';

-- 3. Add new constraint with 'signed' instead of 'accepted'
alter table public.proposals
  add constraint proposals_status_check
  check (status in ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired'));
