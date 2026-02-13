-- Brik Client Portal — Initial Schema
-- Run against your Supabase project: Dashboard → SQL Editor → paste this file
--
-- Tables: profiles, clients, projects, invoices, email_log
-- Auth: Row-Level Security with admin bypass
-- Roles: 'admin' (Brik Designs team) and 'client' (portal users)

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text,
  email text not null,
  client_id uuid,
  invited_at timestamptz,
  invited_by uuid references auth.users(id),
  last_login_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles: users can read their own profile; admins can read all
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Profiles: only admins can insert (via invite flow)
create policy "profiles_insert" on public.profiles
  for insert with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Profiles: admins can update any profile; users can update their own
create policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 2. CLIENTS (synced from Notion)
-- ============================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notion_page_id text unique,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  contact_email text,
  contact_name text,
  website_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

-- Clients: admins see all; clients see only their own
create policy "clients_select" on public.clients
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or id = (select client_id from public.profiles where id = auth.uid())
  );

-- Clients: only admins can manage
create policy "clients_admin_manage" on public.clients
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Add foreign key from profiles.client_id → clients.id
alter table public.profiles
  add constraint profiles_client_id_fkey
  foreign key (client_id) references public.clients(id);

-- ============================================
-- 3. PROJECTS (synced from Notion)
-- ============================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  notion_page_id text unique,
  status text not null default 'active' check (status in ('active', 'completed', 'on_hold', 'cancelled')),
  description text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Projects: admins see all; clients see their own
create policy "projects_select" on public.projects
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Projects: only admins can manage
create policy "projects_admin_manage" on public.projects
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 4. INVOICES (synced from Stripe)
-- ============================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  stripe_invoice_id text unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  description text,
  invoice_date date,
  due_date date,
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

-- Invoices: admins see all; clients see their own
create policy "invoices_select" on public.invoices
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Invoices: only admins can manage
create policy "invoices_admin_manage" on public.invoices
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 5. EMAIL LOG (Resend webhook tracking)
-- ============================================
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  template text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'bounced', 'failed')),
  resend_id text,
  metadata jsonb default '{}',
  sent_at timestamptz not null default now()
);

alter table public.email_log enable row level security;

-- Email log: admins only
create policy "email_log_admin_only" on public.email_log
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================
-- 6. HELPER FUNCTION: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 7. HELPER FUNCTION: update timestamps
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger clients_updated_at before update on public.clients
  for each row execute function public.update_updated_at();

create trigger projects_updated_at before update on public.projects
  for each row execute function public.update_updated_at();

create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.update_updated_at();

-- ============================================
-- 8. INDEXES
-- ============================================
create index idx_profiles_client_id on public.profiles(client_id);
create index idx_profiles_role on public.profiles(role);
create index idx_projects_client_id on public.projects(client_id);
create index idx_projects_status on public.projects(status);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_clients_status on public.clients(status);
