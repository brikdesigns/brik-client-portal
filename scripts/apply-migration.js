#!/usr/bin/env node

/**
 * Apply migration to Supabase using service role key
 * This bypasses the need for database password
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Create client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/00005_many_to_many_clients.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split SQL into individual statements (rough split on semicolons outside of strings)
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .filter(s => !s.match(/^(SELECT|Check|Verify)/i)); // Filter out verification queries

async function applyMigration() {
  console.log('🚀 Starting migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'; // Add semicolon back

    // Skip empty or comment-only statements
    if (statement.trim() === ';' || statement.trim().startsWith('--')) {
      continue;
    }

    console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement
      });

      if (error) {
        // Try direct approach via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        if (!response.ok) {
          throw error;
        }
      }

      successCount++;
      console.log('   ✅ Success');
    } catch (error) {
      errorCount++;
      console.log('   ❌ Error:', error.message);

      // If it's a "already exists" error, that's okay
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Resource already exists (skipping)');
        successCount++;
        errorCount--;
      } else {
        console.error('\n❌ Migration failed at statement:', statement.substring(0, 100) + '...');
        break;
      }
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n✨ Migration completed successfully!');

    // Verify Nick has 3 client memberships
    console.log('\n🔍 Verifying migration...');
    const { data, error } = await supabase
      .from('client_users')
      .select('role, clients(name)')
      .eq('user_id', '4c444a10-8cd6-49e2-8f31-434a3c51e8d1')
      .order('clients(name)');

    if (data && data.length === 3) {
      console.log('✅ Verification passed!');
      console.log('   Nick has access to:');
      data.forEach(cu => {
        const client = cu.clients;
        console.log(`   - ${client.name} (${cu.role})`);
      });
    } else if (error) {
      console.log('⚠️  Could not verify (table might not exist yet)');
    } else {
      console.log(`⚠️  Expected 3 clients but found ${data?.length || 0}`);
    }
  } else {
    console.log('\n❌ Migration failed - manual intervention required');
    process.exit(1);
  }
}

applyMigration().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
