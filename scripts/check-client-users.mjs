import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rnspxmrkpoukccahggli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3B4bXJrcG91a2NjYWhnZ2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNTAxMCwiZXhwIjoyMDg2NTExMDEwfQ.TBKAmumqDECDvYJJ0GpXtkgA3cSengp4zmXeKDcMfVc'
);

console.log('Checking client_users table...\n');

// First get client_users
const { data: clientUsers, error: cuError } = await supabase
  .from('client_users')
  .select('*')
  .order('created_at');

if (cuError) {
  console.error('Error fetching client_users:', cuError);
  process.exit(1);
}

// Then get profiles separately
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, email');

// And clients
const { data: clients } = await supabase
  .from('clients')
  .select('id, name');

// Map them together
const data = clientUsers.map(cu => ({
  ...cu,
  profiles: profiles?.find(p => p.id === cu.user_id),
  clients: clients?.find(c => c.id === cu.client_id)
}));

const error = null;

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`Total records: ${data.length}\n`);
console.log('Records:');
data.forEach(cu => {
  console.log(`- ${cu.profiles?.full_name || cu.profiles?.email} → ${cu.clients?.name} (${cu.role})`);
});
