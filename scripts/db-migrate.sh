#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Supabase Migration Helper
# Checks and applies pending migrations to the target environment.
#
# Usage:
#   ./scripts/db-migrate.sh                    # Staging: show status + apply pending
#   ./scripts/db-migrate.sh --prod             # Production: show status + apply pending
#   ./scripts/db-migrate.sh --status           # Show status only
#   ./scripts/db-migrate.sh --dry-run          # Preview what would be applied
#   ./scripts/db-migrate.sh --prod --dry-run   # Preview against production
#
# Prerequisites:
#   - supabase CLI installed (brew install supabase/tap/supabase)
#   - SUPABASE_ACCESS_TOKEN env var or `supabase login` session

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; }

# ── Environment config ──
# Staging is the default target. Use --prod to target production.
PROD_REF="rnspxmrkpoukccahggli"
STAGING_REF="${SUPABASE_STAGING_PROJECT_REF:-}"

STATUS_ONLY=false
DRY_RUN=false
TARGET="staging"

for arg in "$@"; do
  case "$arg" in
    --prod|--production) TARGET="production" ;;
    --staging) TARGET="staging" ;;
    --status)  STATUS_ONLY=true ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: ./scripts/db-migrate.sh [--prod|--staging] [--status|--dry-run]"
      echo ""
      echo "  (default)    Target staging, show status + apply pending"
      echo "  --prod       Target production (requires confirmation)"
      echo "  --staging    Target staging (default)"
      echo "  --status     Show migration status only"
      echo "  --dry-run    Preview what would be applied"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# Source .env.local for DB passwords (if not already in env)
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  # Only import SUPABASE_ vars to avoid overwriting other env
  eval "$(grep '^SUPABASE_' "$PROJECT_ROOT/.env.local" | sed 's/^/export /')"
fi

STAGING_REF="${SUPABASE_STAGING_PROJECT_REF:-}"

# Resolve project ref and DB password
if [ "$TARGET" = "production" ]; then
  PROJECT_REF="$PROD_REF"
  LABEL="PRODUCTION"
  # Production uses SUPABASE_DB_PASSWORD (already set)
else
  if [ -z "$STAGING_REF" ]; then
    fail "SUPABASE_STAGING_PROJECT_REF not set. Add it to .env.local or export it."
    fail "To target production instead, use: ./scripts/db-migrate.sh --prod"
    exit 1
  fi
  PROJECT_REF="$STAGING_REF"
  LABEL="STAGING"
  # Swap to staging DB password for supabase link/push
  if [ -n "${SUPABASE_STAGING_DB_PASSWORD:-}" ]; then
    export SUPABASE_DB_PASSWORD="$SUPABASE_STAGING_DB_PASSWORD"
  else
    fail "SUPABASE_STAGING_DB_PASSWORD not set. Add it to .env.local or export it."
    exit 1
  fi
fi

echo ""
echo "========================================="
echo "  Supabase Migration Helper"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Target: $LABEL"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# ── Check prerequisites ──
if ! command -v supabase &> /dev/null; then
  fail "supabase CLI not found. Install: brew install supabase/tap/supabase"
  exit 1
fi

info "Linking to $LABEL ($PROJECT_REF)..."
supabase link --project-ref "$PROJECT_REF" 2>/dev/null || {
  fail "Failed to link. Run: supabase login"
  exit 1
}

# ── Repair manually-applied migrations (production only) ──
# Staging gets all migrations via CLI, so no repair needed.
if [ "$TARGET" = "production" ]; then
  # Keep this in sync with .github/workflows/migrate.yml
  APPLIED_MIGRATIONS=(
    00001 00002 00003 00004 00005
    00006 00007 00008 00009 00010 00011
    00012 00013 00014 00015
    00016 00017 00018 00019 00020 00021 00022
    00023 00024
  )

  info "Repairing ${#APPLIED_MIGRATIONS[@]} manually-applied migrations..."
  for v in "${APPLIED_MIGRATIONS[@]}"; do
    supabase migration repair --status applied "$v" 2>/dev/null || true
  done
  pass "Repair complete"
  echo ""
fi

# ── Show status ──
info "Migration status:"
echo ""
supabase migration list 2>/dev/null || {
  fail "Could not list migrations. Check DB password and supabase login status."
  warn "If the pooler password hasn't propagated yet, push to staging branch — CI will apply via access token."
  exit 1
}
echo ""

if [ "$STATUS_ONLY" = true ]; then
  exit 0
fi

# ── Dry run ──
if [ "$DRY_RUN" = true ]; then
  info "Dry run — previewing pending migrations:"
  echo ""
  supabase db push --dry-run 2>&1 || true
  echo ""
  exit 0
fi

# ── Apply ──
echo ""
if [ "$TARGET" = "production" ]; then
  echo -e "  ${RED}⚠  You are about to apply migrations to PRODUCTION${NC}"
  read -rp "  Type 'production' to confirm: " confirm
  if [ "$confirm" != "production" ]; then
    echo "  Aborted."
    exit 0
  fi
else
  read -rp "  Apply pending migrations to $LABEL? (y/N) " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "  Aborted."
    exit 0
  fi
fi

echo ""
info "Applying migrations to $LABEL..."
echo ""

if supabase db push; then
  echo ""
  pass "All migrations applied to $LABEL"
else
  echo ""
  fail "Migration failed — check output above"
  exit 1
fi

echo ""
