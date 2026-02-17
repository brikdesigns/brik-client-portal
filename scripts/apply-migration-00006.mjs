import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rnspxmrkpoukccahggli.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3B4bXJrcG91a2NjYWhnZ2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNTAxMCwiZXhwIjoyMDg2NTExMDEwfQ.TBKAmumqDECDvYJJ0GpXtkgA3cSengp4zmXeKDcMfVc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Applying migration 00006_add_contact_id.sql...\n');
console.log('This migration will:');
console.log('1. Add contact_id column to clients table');
console.log('2. Create index on contact_id');
console.log('3. Migrate existing contact_email data to contact_id\n');
console.log('='.repeat(60) + '\n');

console.log('❌ Cannot execute DDL statements through Supabase REST API');
console.log('');
console.log('Please run the following SQL in Supabase Dashboard SQL Editor:');
console.log('https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/sql/new');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log(`-- Add contact_id field to clients table
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
  and c.contact_id is null;`);
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('After running the SQL, this script will verify the migration...');
console.log('Press Ctrl+C to cancel, or press Enter when ready to verify...');

// Wait for user input
process.stdin.once('data', async () => {
  console.log('\n✓ Verifying migration...\n');

  try {
    // Check if column exists by querying a client
    const { data: clients, error } = await supabase
      .from('clients')
      .select('name, contact_id, contact_email')
      .limit(5);

    if (error) {
      console.error('❌ Error verifying migration:', error.message);
      if (error.message.includes('contact_id')) {
        console.log('\n⚠️  The contact_id column does not exist yet.');
        console.log('   Please run the SQL above in Supabase Dashboard.');
      }
      process.exit(1);
    }

    console.log('Sample clients with contact_id:');
    clients.forEach(c => {
      console.log(`- ${c.name}: contact_id=${c.contact_id ? '✓ ' + c.contact_id.substring(0, 8) + '...' : '✗ null'}, email=${c.contact_email || 'none'}`);
    });

    const withContact = clients.filter(c => c.contact_id).length;
    console.log(`\n✓ Migration verified: ${withContact}/${clients.length} clients have contact_id set`);
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
});
