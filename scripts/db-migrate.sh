#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Supabase Migration Helper
# Checks and applies pending migrations to the live database.
#
# Usage:
#   ./scripts/db-migrate.sh              # Show status + apply pending
#   ./scripts/db-migrate.sh --status     # Show status only
#   ./scripts/db-migrate.sh --dry-run    # Preview what would be applied
#
# Prerequisites:
#   - supabase CLI installed (brew install supabase/tap/supabase)
#   - SUPABASE_ACCESS_TOKEN env var or `supabase login` session
#   - Project linked: supabase link --project-ref rnspxmrkpoukccahggli

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

STATUS_ONLY=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --status)  STATUS_ONLY=true ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: ./scripts/db-migrate.sh [--status|--dry-run]"
      echo ""
      echo "  (default)    Show status, then apply pending migrations"
      echo "  --status     Show migration status only"
      echo "  --dry-run    Preview what would be applied"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

echo ""
echo "========================================="
echo "  Supabase Migration Helper"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="
echo ""

cd "$PROJECT_ROOT"

# ── Check prerequisites ──
if ! command -v supabase &> /dev/null; then
  fail "supabase CLI not found. Install: brew install supabase/tap/supabase"
  exit 1
fi

if [ ! -f "supabase/.temp/project-ref" ] 2>/dev/null; then
  info "Linking Supabase project..."
  supabase link --project-ref rnspxmrkpoukccahggli 2>/dev/null || {
    fail "Failed to link. Run: supabase login"
    exit 1
  }
fi

# ── Repair manually-applied migrations ──
# Keep this in sync with .github/workflows/migrate.yml
APPLIED_MIGRATIONS=(
  00001 00002 00003 00004 00005
  00007 00008 00009 00010 00011
  00012 00013 00014 00015
  00018 00020 00021 00022
)

info "Repairing ${#APPLIED_MIGRATIONS[@]} manually-applied migrations..."
for v in "${APPLIED_MIGRATIONS[@]}"; do
  supabase migration repair --status applied "$v" 2>/dev/null || true
done
pass "Repair complete"
echo ""

# ── Show status ──
info "Migration status:"
echo ""
supabase migration list 2>/dev/null || {
  fail "Could not list migrations. Check supabase login status."
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
read -rp "  Apply pending migrations to LIVE database? (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "  Aborted."
  exit 0
fi

echo ""
info "Applying migrations..."
echo ""

if supabase db push; then
  echo ""
  pass "All migrations applied successfully"
else
  echo ""
  fail "Migration failed — check output above"
  exit 1
fi

echo ""
