# Supabase Local Automation Setup

## The Problem
Running `npm run db:push` was hanging because the Supabase CLI wasn't authenticated locally. This meant migrations had to be applied manually through the dashboard.

## The Solution
Set up local Supabase CLI authentication using the same credentials as the GitHub Action.

## Required Credentials

### 1. SUPABASE_ACCESS_TOKEN
**Purpose:** Authenticates the Supabase CLI
**Status:** ✅ Already in `.env.local`
**How to get:** https://supabase.com/dashboard/account/tokens

### 2. SUPABASE_DB_PASSWORD
**Purpose:** Connects directly to the PostgreSQL database
**Status:** ⚠️ Missing from `.env.local`
**How to get:** https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/settings/database

## Setup Steps

### Step 1: Get Database Password

1. Open: https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/settings/database
2. Scroll to "Database password"
3. Click "Reset database password" (if needed) or reveal existing password
4. Copy the password

### Step 2: Store in 1Password (Recommended)

**Create a new item in 1Password:**
- **Title:** Brik Client Portal - Supabase Database
- **Username:** postgres.rnspxmrkpoukccahggli
- **Password:** [paste the database password]
- **Website:** https://supabase.com/dashboard/project/rnspxmrkpoukccahggli
- **Notes:**
  ```
  Project Ref: rnspxmrkpoukccahggli
  Project URL: https://rnspxmrkpoukccahggli.supabase.co
  Connection String: postgresql://postgres.rnspxmrkpoukccahggli:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
  ```

### Step 3: Add to Local Environment

Add to `.env.local`:
```bash
SUPABASE_DB_PASSWORD=your_password_here
```

### Step 4: Run Setup Script

```bash
./scripts/setup-supabase-local.sh
```

This will:
- ✅ Verify credentials exist
- ✅ Link the Supabase project locally
- ✅ Repair migration history
- ✅ Show current migration status

### Step 5: Test It!

```bash
npm run db:push
```

Should now work without manual intervention! 🎉

## Future: 1Password CLI Integration

To fully automate this, we could integrate 1Password CLI:

```bash
# Install 1Password CLI
brew install --cask 1password-cli

# Reference secrets in .env.local
SUPABASE_DB_PASSWORD="op://Private/Brik Client Portal - Supabase Database/password"

# Run commands with op wrapper
op run -- npm run db:push
```

This would eliminate the need to store credentials in `.env.local` entirely.

## GitHub Secrets

Make sure these are set in GitHub repo settings:
- `SUPABASE_ACCESS_TOKEN` - Same as local
- `SUPABASE_DB_PASSWORD` - Same as local

Check: https://github.com/brikdesigns/brik-client-portal/settings/secrets/actions

## Commands Available After Setup

```bash
npm run db:push      # Apply pending migrations
npm run db:diff      # Generate migration from schema diff
npm run db:status    # List migration status
npm run db:seed      # Reset local DB with seeds (destructive!)
```

## Migration 00006 Specifically

Once setup is complete, run:
```bash
npm run db:push
```

This will apply migration 00006 (add contact_id column) automatically!
