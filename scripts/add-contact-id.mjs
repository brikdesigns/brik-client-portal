import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rnspxmrkpoukccahggli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3B4bXJrcG91a2NjYWhnZ2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNTAxMCwiZXhwIjoyMDg2NTExMDEwfQ.TBKAmumqDECDvYJJ0GpXtkgA3cSengp4zmXeKDcMfVc'
);

console.log('Please run this SQL in Supabase Dashboard SQL Editor:\n');
console.log('='.repeat(60));
console.log(`
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
`);
console.log('='.repeat(60));
console.log('\nAfter running the SQL, press Enter to continue...');

// Wait for user confirmation
process.stdin.once('data', async () => {
  console.log('\nVerifying migration...');

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, contact_id, contact_email')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('\nClients with contact info:');
  clients.forEach(c => {
    console.log(`- ${c.name}: contact_id=${c.contact_id ? '✓' : '✗'}, email=${c.contact_email || 'none'}`);
  });

  console.log('\n✅ Verification complete!');
  process.exit(0);
});
