# Manual RLS Policy Setup

**Why manual?** The RLS policies require DDL execution, which needs either:
- Supabase CLI with access token (not configured locally)
- Direct database connection with password (IPv6 connectivity issue)
- Manual execution in Supabase Dashboard SQL Editor ✅ (works now)

## Quick Steps

1. **Open SQL Editor:**
   https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/sql/new

2. **Copy SQL:**
   The contents of `scripts/update-rls-policies.sql` are ready

3. **Paste and Run** in the SQL Editor

4. **Verify** you see:
   ```
   RLS policies updated successfully!
   ```

## What This Does

Updates RLS policies for these tables to check `client_users` membership:
- `clients` - Users see clients they're members of
- `projects` - Users see projects for their clients
- `invoices` - Users see invoices for their clients
- `client_services` - Users see services for their clients

## After Completion

Test the client switcher:
1. Log in as Nick (admin)
2. See client switcher in user menu
3. Switch between: Brik Designs, Acme Corporation, Pinnacle Labs
4. Click "All Clients (Admin)" to return to admin view

---

**Automation alternative:** Add `SUPABASE_ACCESS_TOKEN` to `.env.local` and run `npm run db:push`
Get token from: https://supabase.com/dashboard/account/tokens
