-- Migration 00006: Add contact_id to clients table
-- Copy and paste this into Supabase SQL Editor: https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/sql/new

-- Step 1: Add contact_id field to clients table
alter table public.clients
  add column if not exists contact_id uuid references auth.users(id) on delete set null;

-- Step 2: Create index for faster lookups
create index if not exists clients_contact_id_idx on public.clients(contact_id);

-- Step 3: Migrate existing contact data
-- For clients with contact_email that matches a user email, set contact_id
update public.clients c
set contact_id = p.id
from public.profiles p
where c.contact_email = p.email
  and c.contact_id is null;

-- Step 4: Verify the migration
select
  name,
  contact_id,
  contact_email,
  case when contact_id is not null then '✓ Linked' else '✗ Not linked' end as status
from public.clients
order by name;
