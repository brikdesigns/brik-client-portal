#!/bin/bash

echo "🔧 Supabase Local Setup - Automation Fix"
echo "=========================================="
echo ""

# Load existing env vars
if [ -f .env.local ]; then
  source .env.local
fi

# Check SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not found"
  echo ""
  echo "To get your access token:"
  echo "1. Go to: https://supabase.com/dashboard/account/tokens"
  echo "2. Generate a new token"
  echo "3. Add to .env.local: SUPABASE_ACCESS_TOKEN=your_token_here"
  echo ""
  exit 1
else
  echo "✅ SUPABASE_ACCESS_TOKEN found"
fi

# Check SUPABASE_DB_PASSWORD
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "⚠️  SUPABASE_DB_PASSWORD not found"
  echo ""
  echo "To get your database password:"
  echo "1. Go to: https://supabase.com/dashboard/project/rnspxmrkpoukccahggli/settings/database"
  echo "2. Click 'Reset database password' if needed"
  echo "3. Copy the password"
  echo "4. Add to .env.local: SUPABASE_DB_PASSWORD=your_password_here"
  echo ""
  echo "Or check 1Password if it's already stored there!"
  echo ""
  read -p "Press Enter after adding the password to .env.local, or Ctrl+C to exit..."
  source .env.local

  if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Still not found. Please add it and run again."
    exit 1
  fi
fi

echo "✅ SUPABASE_DB_PASSWORD found"
echo ""

# Link the project
echo "🔗 Linking Supabase project..."
supabase link --project-ref rnspxmrkpoukccahggli

if [ $? -eq 0 ]; then
  echo "✅ Project linked successfully"
else
  echo "❌ Failed to link project"
  exit 1
fi

echo ""

# Repair manually-applied migrations
echo "🔧 Repairing manually-applied migrations..."
supabase migration repair --status applied 00001 2>/dev/null || true
supabase migration repair --status applied 00002 2>/dev/null || true
supabase migration repair --status applied 00003 2>/dev/null || true

echo "✅ Migration history repaired"
echo ""

# Check migration status
echo "📊 Current migration status:"
supabase migration list

echo ""
echo "✅ Setup complete! You can now use:"
echo "   npm run db:push    - Apply pending migrations"
echo "   npm run db:status  - Check migration status"
echo ""
