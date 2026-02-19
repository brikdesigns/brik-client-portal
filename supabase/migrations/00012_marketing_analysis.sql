-- Migration: 00012_marketing_analysis.sql
-- Marketing Analysis: report_sets, reports, report_items

-- One report set per client (the overall analysis)
create table public.report_sets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  status text default 'in_progress'
    check (status in ('in_progress','completed','needs_review')),
  overall_score integer,
  overall_max_score integer,
  overall_tier text check (overall_tier in ('pass','fair','fail')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One report per type per analysis
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  report_set_id uuid not null references public.report_sets(id) on delete cascade,
  report_type text not null
    check (report_type in (
      'online_reviews','website','brand_logo','competitors',
      'patient','patient_comms','guest','guest_comms'
    )),
  status text default 'draft'
    check (status in ('draft','in_progress','completed','needs_review')),
  score integer,
  max_score integer,
  tier text check (tier in ('pass','fair','fail')),
  opportunities_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(report_set_id, report_type)
);

-- Individual data rows per report
create table public.report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  category text not null,
  status text default 'neutral'
    check (status in ('pass','warning','error','neutral')),
  score numeric,
  rating numeric,
  total_reviews integer,
  feedback_summary text,
  notes text,
  metadata jsonb default '{}',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Indexes
create index idx_report_sets_client on public.report_sets(client_id);
create index idx_report_sets_status on public.report_sets(status);
create index idx_reports_set on public.reports(report_set_id);
create index idx_reports_type on public.reports(report_type);
create index idx_report_items_report on public.report_items(report_id);

-- RLS
alter table public.report_sets enable row level security;
alter table public.reports enable row level security;
alter table public.report_items enable row level security;

create policy "Admin full access to report_sets"
  on public.report_sets for all
  using ((select public.get_user_role()) = 'admin');

create policy "Admin full access to reports"
  on public.reports for all
  using ((select public.get_user_role()) = 'admin');

create policy "Admin full access to report_items"
  on public.report_items for all
  using ((select public.get_user_role()) = 'admin');
