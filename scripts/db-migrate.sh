#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Supabase Migration Helper
# Checks and applies pending migrations to the target environment.
#
# Uses Supabase CLI as primary path. If CLI fails (bad DB password, pooler
# issues), automatically falls back to Management API (db-migrate-api.sh).
#
# Usage:
#   ./scripts/db-migrate.sh                    # Staging: show status + apply pending
#   ./scripts/db-migrate.sh --prod             # Production: show status + apply pending
#   ./scripts/db-migrate.sh --status           # Show status only
#   ./scripts/db-migrate.sh --dry-run          # Preview what would be applied
#   ./scripts/db-migrate.sh --prod --dry-run   # Preview against production
#   ./scripts/db-migrate.sh --api              # Skip CLI, use Management API directly
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
API_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --prod|--production) TARGET="production" ;;
    --staging) TARGET="staging" ;;
    --status)  STATUS_ONLY=true ;;
    --dry-run) DRY_RUN=true ;;
    --api)     API_ONLY=true ;;
    --help|-h)
      echo "Usage: ./scripts/db-migrate.sh [--prod|--staging] [--status|--dry-run|--api]"
      echo ""
      echo "  (default)    Target staging, show status + apply pending"
      echo "  --prod       Target production (requires confirmation)"
      echo "  --staging    Target staging (default)"
      echo "  --status     Show migration status only"
      echo "  --dry-run    Preview what would be applied"
      echo "  --api        Skip CLI, use Management API directly"
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

# ── API-only mode: delegate entirely to db-migrate-api.sh ──
if [ "$API_ONLY" = true ]; then
  API_ARGS=()
  [ "$TARGET" = "production" ] && API_ARGS+=(--prod) || API_ARGS+=(--staging)
  [ "$STATUS_ONLY" = true ] && API_ARGS+=(--status)
  [ "$DRY_RUN" = true ] && API_ARGS+=(--dry-run)
  exec "$SCRIPT_DIR/db-migrate-api.sh" "${API_ARGS[@]}"
fi

# ── Try CLI first, fall back to API ──
CLI_AVAILABLE=true

if ! command -v supabase &> /dev/null; then
  warn "supabase CLI not found — using Management API"
  CLI_AVAILABLE=false
fi

if [ "$CLI_AVAILABLE" = true ]; then
  info "Linking to $LABEL ($PROJECT_REF)..."
  if ! supabase link --project-ref "$PROJECT_REF" 2>/dev/null; then
    warn "CLI link failed — will fall back to Management API if needed"
    CLI_AVAILABLE=false
  fi
fi

# ── Show status (try CLI, fall back to API) ──
if [ "$CLI_AVAILABLE" = true ]; then
  info "Migration status (via CLI):"
  echo ""
  if ! supabase migration list 2>/dev/null; then
    warn "CLI cannot list migrations (DB password issue?) — falling back to API"
    CLI_AVAILABLE=false
    echo ""
    "$SCRIPT_DIR/db-migrate-api.sh" --status \
      $([ "$TARGET" = "production" ] && echo "--prod" || echo "--staging")
  fi
  echo ""
else
  "$SCRIPT_DIR/db-migrate-api.sh" --status \
    $([ "$TARGET" = "production" ] && echo "--prod" || echo "--staging")
  echo ""
fi

if [ "$STATUS_ONLY" = true ]; then
  exit 0
fi

# ── Dry run ──
if [ "$DRY_RUN" = true ]; then
  if [ "$CLI_AVAILABLE" = true ]; then
    info "Dry run (via CLI):"
    echo ""
    supabase db push --dry-run 2>&1 || true
  else
    "$SCRIPT_DIR/db-migrate-api.sh" --dry-run \
      $([ "$TARGET" = "production" ] && echo "--prod" || echo "--staging")
  fi
  echo ""
  exit 0
fi

# ── Confirmation ──
echo ""
if [ "$TARGET" = "production" ]; then
  echo -e "  ${RED}WARNING: Applying to PRODUCTION${NC}"
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

# ── Apply ──
echo ""
if [ "$CLI_AVAILABLE" = true ]; then
  info "Applying migrations to $LABEL via CLI..."
  echo ""

  if supabase db push; then
    echo ""
    pass "All migrations applied to $LABEL (via CLI)"
  else
    echo ""
    warn "CLI failed — falling back to Management API..."
    echo ""
    if "$SCRIPT_DIR/db-migrate-api.sh" \
      $([ "$TARGET" = "production" ] && echo "--prod" || echo "--staging") --ci; then
      pass "All migrations applied to $LABEL (via API fallback)"
    else
      fail "Both CLI and Management API failed"
      exit 1
    fi
  fi
else
  info "Applying migrations to $LABEL via Management API..."
  echo ""
  if "$SCRIPT_DIR/db-migrate-api.sh" \
    $([ "$TARGET" = "production" ] && echo "--prod" || echo "--staging") --ci; then
    pass "All migrations applied to $LABEL (via API)"
  else
    fail "Management API migration failed"
    exit 1
  fi
fi

echo ""
