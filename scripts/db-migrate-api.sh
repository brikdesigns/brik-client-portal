#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Management API Migration Runner
#
# Applies migrations via Supabase Management API. No DB password needed —
# only requires SUPABASE_ACCESS_TOKEN (account-level, never expires).
#
# This is the PRIMARY migration path for CI and the FALLBACK for local use.
# The Supabase CLI (db-migrate.sh) is kept for local convenience but
# depends on a DB password that drifts. This script eliminates that dependency.
#
# Usage:
#   ./scripts/db-migrate-api.sh                    # Apply to staging
#   ./scripts/db-migrate-api.sh --prod             # Apply to production
#   ./scripts/db-migrate-api.sh --status           # Show applied vs pending
#   ./scripts/db-migrate-api.sh --dry-run          # Preview only
#   ./scripts/db-migrate-api.sh --ci               # Non-interactive (for GitHub Actions)
#
# Requirements:
#   - SUPABASE_ACCESS_TOKEN (env var or .env.local)
#   - curl, jq (standard on macOS + GitHub Actions runners)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; }

# ── Config ──
PROD_REF="rnspxmrkpoukccahggli"
STAGING_REF="lmhzpzobdkstzpvsqest"

TARGET="staging"
DRY_RUN=false
STATUS_ONLY=false
CI_MODE=false

for arg in "$@"; do
  case "$arg" in
    --prod|--production) TARGET="production" ;;
    --staging) TARGET="staging" ;;
    --dry-run) DRY_RUN=true ;;
    --status) STATUS_ONLY=true ;;
    --ci) CI_MODE=true ;;
    --help|-h)
      echo "Usage: ./scripts/db-migrate-api.sh [--prod|--staging] [--status|--dry-run|--ci]"
      echo ""
      echo "  (default)    Target staging, apply pending migrations"
      echo "  --prod       Target production (requires confirmation)"
      echo "  --staging    Target staging (default)"
      echo "  --status     Show applied vs pending migrations"
      echo "  --dry-run    Preview what would be applied"
      echo "  --ci         Non-interactive mode (for GitHub Actions)"
      exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# ── Resolve token ──
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && [ -f "$PROJECT_ROOT/.env.local" ]; then
  SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' "$PROJECT_ROOT/.env.local" | cut -d= -f2- || true)
  export SUPABASE_ACCESS_TOKEN
fi
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  fail "SUPABASE_ACCESS_TOKEN not set. Export it or add to .env.local."
  exit 1
fi

# ── Resolve project ref from env if available ──
if [ -z "${SUPABASE_STAGING_PROJECT_REF:-}" ] && [ -f "$PROJECT_ROOT/.env.local" ]; then
  SUPABASE_STAGING_PROJECT_REF=$(grep '^SUPABASE_STAGING_PROJECT_REF=' "$PROJECT_ROOT/.env.local" | cut -d= -f2- || true)
fi
if [ -n "${SUPABASE_STAGING_PROJECT_REF:-}" ]; then
  STAGING_REF="$SUPABASE_STAGING_PROJECT_REF"
fi

if [ "$TARGET" = "production" ]; then
  PROJECT_REF="$PROD_REF"
  LABEL="PRODUCTION"
else
  PROJECT_REF="$STAGING_REF"
  LABEL="STAGING"
fi

API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

# ── SQL executor via Management API ──
# Returns JSON result on success. Prints error and returns 1 on failure.
exec_sql() {
  local sql="$1"
  local response http_code body

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg q "$sql" '{query: $q}')")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    # Check for SQL error in response body
    local msg
    msg=$(echo "$body" | jq -r '.message // empty' 2>/dev/null || echo "$body")
    if [ -n "$msg" ]; then
      echo "ERROR: $msg" >&2
    else
      echo "ERROR: HTTP $http_code" >&2
    fi
    return 1
  fi

  echo "$body"
}

echo ""
echo "========================================="
echo "  Migration Runner (Management API)"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Target: $LABEL"
echo "========================================="
echo ""

# ── Verify connectivity ──
info "Testing Management API connectivity..."
PING=$(exec_sql "SELECT 1 AS ok" 2>&1) || {
  fail "Cannot reach Management API for $LABEL ($PROJECT_REF)"
  echo "  $PING"
  fail "Check SUPABASE_ACCESS_TOKEN validity"
  exit 1
}
pass "Connected to $LABEL"

# ── Get applied migrations ──
info "Checking applied migrations..."
APPLIED_JSON=$(exec_sql "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version" 2>&1) || {
  fail "Could not query schema_migrations"
  echo "  $APPLIED_JSON"
  exit 1
}

# Parse into version list
APPLIED_VERSIONS=$(echo "$APPLIED_JSON" | jq -r '.[].version' 2>/dev/null || echo "")
APPLIED_COUNT=$(echo "$APPLIED_VERSIONS" | grep -c . 2>/dev/null || echo "0")

# ── Get local migration files ──
LOCAL_FILES=()
if [ -d "$MIGRATIONS_DIR" ]; then
  while IFS= read -r f; do
    LOCAL_FILES+=("$f")
  done < <(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort)
fi
LOCAL_COUNT=${#LOCAL_FILES[@]}

# ── Determine pending ──
PENDING=()
for f in "${LOCAL_FILES[@]}"; do
  BASENAME=$(basename "$f" .sql)
  # Version is the full filename stem (e.g., "00028_contact_owner_role")
  # But schema_migrations stores just the number prefix for our project
  # Check both formats for compatibility
  VERSION_FULL="$BASENAME"
  VERSION_NUM="${BASENAME%%_*}"  # "00028"

  if echo "$APPLIED_VERSIONS" | grep -qE "^(${VERSION_FULL}|${VERSION_NUM})$"; then
    continue
  fi
  PENDING+=("$f")
done

# ── Status display ──
echo ""
info "Applied: $APPLIED_COUNT | Local: $LOCAL_COUNT | Pending: ${#PENDING[@]}"

if [ "$STATUS_ONLY" = true ]; then
  if [ ${#PENDING[@]} -gt 0 ]; then
    echo ""
    info "Pending migrations:"
    for f in "${PENDING[@]}"; do
      echo "    $(basename "$f")"
    done
  fi
  echo ""

  # Also show applied list
  info "Applied migrations:"
  echo "$APPLIED_JSON" | jq -r '.[] | "    \(.version) — \(.name // "unnamed")"' 2>/dev/null || echo "    (could not parse)"
  echo ""
  exit 0
fi

if [ ${#PENDING[@]} -eq 0 ]; then
  echo ""
  pass "All $LOCAL_COUNT migrations already applied to $LABEL"
  echo ""
  exit 0
fi

echo ""
info "${#PENDING[@]} pending migration(s):"
for f in "${PENDING[@]}"; do
  echo "    $(basename "$f")"
done

if [ "$DRY_RUN" = true ]; then
  echo ""
  info "Dry run — no changes applied"
  echo ""
  exit 0
fi

# ── Confirmation ──
if [ "$CI_MODE" = false ]; then
  echo ""
  if [ "$TARGET" = "production" ]; then
    echo -e "  ${RED}WARNING: Applying to PRODUCTION${NC}"
    read -rp "  Type 'production' to confirm: " confirm
    [ "$confirm" != "production" ] && echo "  Aborted." && exit 0
  else
    read -rp "  Apply ${#PENDING[@]} migration(s) to $LABEL? (y/N) " confirm
    [[ ! "$confirm" =~ ^[Yy]$ ]] && echo "  Aborted." && exit 0
  fi
fi

# ── Apply each migration ──
echo ""
APPLIED=0
FAILED=0

for f in "${PENDING[@]}"; do
  NAME=$(basename "$f")
  VERSION_NUM="${NAME%%_*}"
  MIGRATION_NAME="${NAME%.sql}"
  MIGRATION_NAME="${MIGRATION_NAME#*_}"  # Strip version prefix: "contact_owner_role"

  info "Applying $NAME..."

  SQL_CONTENT=$(cat "$f")

  # Execute the migration SQL
  RESULT=$(exec_sql "$SQL_CONTENT" 2>&1) || {
    fail "FAILED: $NAME"
    echo ""
    echo "  Error: $RESULT"
    echo ""
    FAILED=$((FAILED + 1))
    break  # Stop on first failure — migrations are sequential
  }

  # Check for error in JSON response
  ERROR_MSG=$(echo "$RESULT" | jq -r '.message // empty' 2>/dev/null || echo "")
  if [ -n "$ERROR_MSG" ] && echo "$ERROR_MSG" | grep -qi "error\|fail"; then
    fail "FAILED: $NAME — $ERROR_MSG"
    FAILED=$((FAILED + 1))
    break
  fi

  # Record in schema_migrations (idempotent — ON CONFLICT DO NOTHING)
  RECORD_SQL="INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${VERSION_NUM}', '${MIGRATION_NAME}') ON CONFLICT (version) DO NOTHING"
  exec_sql "$RECORD_SQL" >/dev/null 2>&1 || {
    warn "Migration applied but failed to record in schema_migrations"
  }

  pass "Applied: $NAME"
  APPLIED=$((APPLIED + 1))
done

echo ""
if [ "$FAILED" -eq 0 ]; then
  pass "All ${#PENDING[@]} migration(s) applied to $LABEL"
else
  fail "$FAILED migration(s) failed ($APPLIED succeeded before failure)"
  exit 1
fi
echo ""
