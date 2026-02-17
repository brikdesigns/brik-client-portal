#!/usr/bin/env node

/**
 * Automated migration runner using Supabase service role key
 * Executes the many-to-many client relationships migration
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

// Create admin client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function runMigration() {
  console.log('🚀 Starting automated migration...\n');

  try {
    // Step 1: Create Brik Designs client
    console.log('1️⃣  Creating Brik Designs client...');
    const { error: clientError } = await supabase
      .from('clients')
      .upsert({
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Brik Designs',
        slug: 'brik-designs',
        status: 'active',
        contact_name: 'Nick Stanerson',
        contact_email: 'nick@brikdesigns.com',
        website_url: 'https://brikdesigns.com',
        notes: 'Brik Designs company account — default client for admin "View as Client" mode'
      }, { onConflict: 'id' });

    if (clientError && !clientError.message.includes('already exists')) {
      throw clientError;
    }
    console.log('   ✅ Brik Designs client ready\n');

    // Step 2: Migrate existing profiles to client_users
    console.log('2️⃣  Migrating existing profile data...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, client_id')
      .not('client_id', 'is', null);

    if (profiles && profiles.length > 0) {
      const clientUsers = profiles.map(p => ({
        user_id: p.id,
        client_id: p.client_id,
        role: 'owner'
      }));

      const { error: migrateError } = await supabase
        .from('client_users')
        .upsert(clientUsers, { onConflict: 'user_id,client_id', ignoreDuplicates: true });

      if (migrateError && !migrateError.message.includes('already exists')) {
        console.warn('   ⚠️  Migration warning:', migrateError.message);
      }
    }
    console.log('   ✅ Profile data migrated\n');

    // Step 3: Add Nick to all 3 clients
    console.log('3️⃣  Mapping Nick to all clients...');
    const nickMemberships = [
      { user_id: '4c444a10-8cd6-49e2-8f31-434a3c51e8d1', client_id: 'b0000000-0000-0000-0000-000000000001', role: 'owner' },
      { user_id: '4c444a10-8cd6-49e2-8f31-434a3c51e8d1', client_id: 'a0000000-0000-0000-0000-000000000001', role: 'owner' },
      { user_id: '4c444a10-8cd6-49e2-8f31-434a3c51e8d1', client_id: 'a0000000-0000-0000-0000-000000000002', role: 'owner' },
    ];

    const { error: nickError } = await supabase
      .from('client_users')
      .upsert(nickMemberships, { onConflict: 'user_id,client_id', ignoreDuplicates: true });

    if (nickError && !nickError.message.includes('already exists')) {
      throw nickError;
    }
    console.log('   ✅ Nick mapped to 3 clients\n');

    // Step 4: Verify migration
    console.log('4️⃣  Verifying migration...');
    const { data: verification, error: verifyError } = await supabase
      .from('client_users')
      .select('role, clients(name)')
      .eq('user_id', '4c444a10-8cd6-49e2-8f31-434a3c51e8d1');

    if (verifyError) {
      throw verifyError;
    }

    console.log('\n✨ Migration completed successfully!\n');
    console.log('📊 Nick has access to:');
    verification.forEach(cu => {
      console.log(`   - ${cu.clients.name} (${cu.role})`);
    });

    if (verification.length !== 3) {
      console.warn(`\n⚠️  Expected 3 clients but found ${verification.length}`);
    }

    console.log('\n🎉 Done! You can now test the client switcher in the portal.');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Execute migration
runMigration();
