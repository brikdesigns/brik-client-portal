-- Migration: 00011_proposals
-- Custom proposal system for prospect onboarding
-- Admin creates proposals from service catalog, shares via token-based link
-- Client views and accepts in-browser (ESIGN Act compliant clickwrap)

-- Proposals table
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  status text default 'draft'
    check (status in ('draft','sent','viewed','accepted','declined','expired')),
  token text unique not null,
  valid_until date,
  notes text,
  total_amount_cents integer not null default 0,

  -- Acceptance audit trail (ESIGN Act compliance)
  accepted_at timestamptz,
  accepted_by_email text,
  accepted_by_ip text,
  accepted_by_user_agent text,

  -- Tracking
  first_viewed_at timestamptz,
  view_count integer default 0,
  sent_at timestamptz,

  -- Stripe link (future)
  stripe_invoice_id text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Proposal line items
create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  service_id uuid references public.services(id),
  name text not null,
  description text,
  quantity integer default 1,
  unit_price_cents integer not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Indexes
create index idx_proposals_client_id on public.proposals(client_id);
create index idx_proposals_token on public.proposals(token);
create index idx_proposals_status on public.proposals(status);
create index idx_proposal_items_proposal_id on public.proposal_items(proposal_id);

-- RLS
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;

-- Admin full access
create policy "Admin full access to proposals"
  on public.proposals for all
  using ((select public.get_user_role()) = 'admin');

create policy "Admin full access to proposal_items"
  on public.proposal_items for all
  using ((select public.get_user_role()) = 'admin');
