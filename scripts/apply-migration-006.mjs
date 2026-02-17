import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://rnspxmrkpoukccahggli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3B4bXJrcG91a2NjYWhnZ2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkzNTAxMCwiZXhwIjoyMDg2NTExMDEwfQ.TBKAmumqDECDvYJJ0GpXtkgA3cSengp4zmXeKDcMfVc'
);

const sql = readFileSync('supabase/migrations/00006_add_contact_id.sql', 'utf-8');

console.log('Applying migration 00006_add_contact_id.sql...\n');

// Split by semicolon and execute each statement
const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

for (const statement of statements) {
  if (!statement) continue;

  console.log(`Executing: ${statement.substring(0, 60)}...`);

  const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

console.log('\n✅ Migration applied successfully!');
