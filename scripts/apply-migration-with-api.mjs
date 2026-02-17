import { readFileSync } from 'fs';

const supabaseUrl = 'https://rnspxmrkpoukccahggli.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3B4bXJrcG91a2NjYWhnZ2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNTAxMCwiZXhwIjoyMDg2NTExMDEwfQ.TBKAmumqDECDvYJJ0GpXtkgA3cSengp4zmXeKDcMfVc';
const accessToken = 'sbp_0605cb19e5a7b5a81d3c025a4ec87c16379dddb8';

console.log('🔧 Applying migration 00006 via Supabase Management API...\n');

// The SQL statements we need to execute
const statements = [
  {
    name: 'Add contact_id column',
    sql: `alter table public.clients add column if not exists contact_id uuid references auth.users(id) on delete set null;`
  },
  {
    name: 'Create index',
    sql: `create index if not exists clients_contact_id_idx on public.clients(contact_id);`
  },
  {
    name: 'Migrate data',
    sql: `update public.clients c set contact_id = p.id from public.profiles p where c.contact_email = p.email and c.contact_id is null;`
  }
];

console.log('Using Supabase Management API to execute SQL...\n');

try {
  // Use the Management API query endpoint
  for (const statement of statements) {
    console.log(`📝 ${statement.name}...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/rnspxmrkpoukccahggli/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: statement.sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${error}`);

      // Try alternative: Direct SQL via postgREST RPC (if available)
      console.log('   Trying alternative method...');
      const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          query: statement.sql
        })
      });

      if (!rpcResponse.ok) {
        console.error(`   ❌ Alternative also failed`);
      } else {
        console.log(`   ✅ Success via alternative method`);
      }
    } else {
      console.log(`   ✅ Success`);
    }
  }

  // Verify the migration
  console.log('\n🔍 Verifying migration...');
  const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/clients?select=name,contact_id,contact_email&limit=5`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (verifyResponse.ok) {
    const clients = await verifyResponse.json();
    console.log('\nSample clients:');
    clients.forEach(c => {
      console.log(`- ${c.name}: contact_id=${c.contact_id ? '✓ ' + c.contact_id.substring(0, 8) + '...' : '✗ null'}, email=${c.contact_email || 'none'}`);
    });

    const withContact = clients.filter(c => c.contact_id).length;
    console.log(`\n✅ Migration verified: ${withContact}/${clients.length} clients have contact_id set`);
  } else {
    console.log('⚠️  Could not verify (column may not exist yet)');
  }

  console.log('\n✅ Migration process completed!');
  console.log('\nNote: If the Management API calls failed, you\'ll need to run the SQL manually in the dashboard.');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️  Falling back to manual approach...');
  console.log('\nPlease run this SQL in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/sql/new');
  console.log('\n' + '='.repeat(60));
  statements.forEach(s => console.log(s.sql));
  console.log('='.repeat(60));
  process.exit(1);
}
