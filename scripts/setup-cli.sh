#!/bin/bash

# Setup Supabase CLI for automated migrations
# This script helps get the CLI configured for `npm run db:push`

PROJECT_REF="rnspxmrkpoukccahggli"

echo "🔧 Supabase CLI Setup"
echo "====================="
echo ""
echo "To run automated migrations, we need a Supabase access token."
echo ""
echo "📋 Steps:"
echo "   1. Open: https://supabase.com/dashboard/account/tokens"
echo "   2. Click 'Generate new token'"
echo "   3. Name it: 'CLI - brik-client-portal'"
echo "   4. Copy the token"
echo "   5. Add to .env.local:"
echo "      SUPABASE_ACCESS_TOKEN=sbp_..."
echo ""
echo "Then run:"
echo "   npm run db:push"
echo ""
echo "This will apply the pending RLS policy updates from migration 00005."
