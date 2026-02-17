#!/usr/bin/env node

/**
 * Apply RLS policy updates using PostgreSQL client
 * Executes DDL from scripts/update-rls-policies.sql
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!PROJECT_REF) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// Supabase connection pooler uses format:
// postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
//
// Note: This requires the database password from Supabase Dashboard → Project Settings → Database → Connection string
// The password is NOT the service role key - it's a separate database password

console.log('🔍 To get your database password:');
console.log('   1. Open https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database');
console.log('   2. Look for "Connection string" or "Database password"');
console.log('   3. Add it to .env.local as DATABASE_PASSWORD=...\n');

const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;

if (!DATABASE_PASSWORD) {
  console.error('❌ DATABASE_PASSWORD not found in .env.local');
  console.error('');
  console.error('Alternative: Apply SQL manually via Supabase Dashboard');
  console.error('   1. Open https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
  console.error('   2. Copy contents of scripts/update-rls-policies.sql');
  console.error('   3. Paste and run');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${PROJECT_REF}:${DATABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function applyRLSPolicies() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('   ✅ Connected\n');

    // Read RLS policy SQL
    const sqlPath = path.join(__dirname, 'update-rls-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing RLS policy updates...\n');

    // Execute the SQL (all at once since it's DDL)
    await client.query(sql);

    console.log('✅ RLS policies updated successfully!\n');

    // Verify policies exist
    console.log('🔍 Verifying policies...');
    const { rows } = await client.query(`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('clients', 'projects', 'invoices', 'client_services', 'client_users')
      ORDER BY tablename, policyname;
    `);

    console.log('\n📊 Active policies:');
    rows.forEach(row => {
      console.log(`   - ${row.tablename}.${row.policyname}`);
    });

    console.log('\n🎉 Migration complete! The portal now uses client_users for access control.');

  } catch (error) {
    console.error('\n💥 Failed to apply RLS policies:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLSPolicies();
