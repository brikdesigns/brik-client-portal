-- Brik Client Portal — Services Schema
-- Run against your Supabase project: Dashboard → SQL Editor → paste this file
--
-- Tables: service_categories, services, client_services
-- Auth: Row-Level Security with admin bypass
-- Depends on: 00001_initial_schema.sql (profiles, clients)

-- ============================================
-- 1. SERVICE CATEGORIES (5 rows: Brand, Marketing, Information, Product, Service)
-- ============================================
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  color_token text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_categories enable row level security;

-- Categories: everyone authenticated can read
create policy "service_categories_select" on public.service_categories
  for select using (auth.uid() is not null);

-- Categories: only admins can manage
create policy "service_categories_admin_manage" on public.service_categories
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 2. SERVICES (catalog of offerings)
-- ============================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id),
  name text not null,
  description text,
  service_type text not null default 'one_time' check (service_type in ('one_time', 'recurring', 'add_on')),
  billing_frequency text check (billing_frequency in ('one_time', 'monthly')),
  base_price_cents integer,
  stripe_product_id text,
  stripe_price_id text,
  active boolean not null default true,
  notion_page_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

-- Services: everyone authenticated can read active services
create policy "services_select" on public.services
  for select using (auth.uid() is not null);

-- Services: only admins can manage
create policy "services_admin_manage" on public.services
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 3. CLIENT SERVICES (assignments — what each client has)
-- ============================================
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'completed')),
  started_at timestamptz default now(),
  cancelled_at timestamptz,
  stripe_subscription_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, service_id)
);

alter table public.client_services enable row level security;

-- Client services: admins see all; clients see their own
create policy "client_services_select" on public.client_services
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Client services: only admins can manage
create policy "client_services_admin_manage" on public.client_services
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 4. UPDATED_AT TRIGGERS
-- ============================================
create trigger service_categories_updated_at before update on public.service_categories
  for each row execute function public.update_updated_at();

create trigger services_updated_at before update on public.services
  for each row execute function public.update_updated_at();

create trigger client_services_updated_at before update on public.client_services
  for each row execute function public.update_updated_at();

-- ============================================
-- 5. INDEXES
-- ============================================
create index idx_services_category_id on public.services(category_id);
create index idx_services_active on public.services(active);
create index idx_client_services_client_id on public.client_services(client_id);
create index idx_client_services_service_id on public.client_services(service_id);
create index idx_client_services_status on public.client_services(status);
