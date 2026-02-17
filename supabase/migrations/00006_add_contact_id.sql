-- Add contact_id field to clients table
alter table public.clients
  add column contact_id uuid references auth.users(id) on delete set null;

-- Create index for faster lookups
create index clients_contact_id_idx on public.clients(contact_id);

-- Migrate existing contact data:
-- For clients with contact_email that matches a user email, set contact_id
update public.clients c
set contact_id = p.id
from public.profiles p
where c.contact_email = p.email
  and c.contact_id is null;
