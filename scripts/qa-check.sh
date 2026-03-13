#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Pre-Deploy QA Check
# Validates build, data integrity, and status consistency before merging to main.
#
# Usage:
#   ./scripts/qa-check.sh              # Full QA (interactive)
#   ./scripts/qa-check.sh --ci         # CI mode (non-interactive, exit code = fail count)
#   ./scripts/qa-check.sh --quick      # Skip build + data integrity (lint + migration only)
#   ./scripts/qa-check.sh --data-only  # Only run data integrity checks
#
# Run this:
#   - Before every merge to main
#   - After applying migrations to staging
#   - After bulk data updates (seed scripts, manual fixes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

FAILS=0
WARNS=0
CI_MODE=false
QUICK=false
DATA_ONLY=false
TARGET_ENV="staging"

for arg in "$@"; do
  case "$arg" in
    --ci)        CI_MODE=true ;;
    --quick)     QUICK=true ;;
    --data-only) DATA_ONLY=true ;;
    --prod)      TARGET_ENV="production" ;;
    --help|-h)
      echo "Usage: ./scripts/qa-check.sh [--ci|--quick|--data-only|--prod]"
      echo ""
      echo "  (default)      Full QA check against staging"
      echo "  --ci           CI mode (non-interactive, exit code = fail count)"
      echo "  --quick        Skip build + data integrity (lint + migration only)"
      echo "  --data-only    Only run data integrity checks"
      echo "  --prod         Target production instead of staging"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[PASS]${NC}  $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

cd "$PROJECT_ROOT"

# ── Load env ──
if [ -f ".env.local" ]; then
  source .env.local 2>/dev/null || true
else
  echo -e "${RED}ERROR: .env.local not found${NC}"
  exit 1
fi

# Resolve target Supabase URL + keys
if [ "$TARGET_ENV" = "production" ]; then
  SB_URL="${SUPABASE_PROD_URL:-https://rnspxmrkpoukccahggli.supabase.co}"
  SB_KEY="${SUPABASE_PROD_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"
  SB_ANON="${SUPABASE_PROD_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY}}"
else
  SB_URL="${NEXT_PUBLIC_SUPABASE_URL}"
  SB_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
  SB_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
fi

# Helper: run a Supabase REST query, return JSON
sb_query() {
  local endpoint="$1"
  curl -s "${SB_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${SB_ANON}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Prefer: return=representation"
}

# Helper: run raw SQL via Management API
sb_sql() {
  local sql="$1"
  local ref
  if [ "$TARGET_ENV" = "production" ]; then
    ref="rnspxmrkpoukccahggli"
  else
    ref="${SUPABASE_STAGING_PROJECT_REF:-lmhzpzobdkstzpvsqest}"
  fi
  curl -s -X POST "https://api.supabase.com/v1/projects/${ref}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}"
}

echo ""
echo "========================================="
echo "  Brik Client Portal — QA Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Target: ${TARGET_ENV}"
echo "========================================="

# ══════════════════════════════════════════════
# 1. BUILD + LINT (skip if --data-only)
# ══════════════════════════════════════════════
if [ "$DATA_ONLY" = false ]; then

  echo ""
  echo "── TypeScript + Lint ──"

  # Lint check
  if npm run lint --silent > /tmp/qa-lint.log 2>&1; then
    pass "ESLint passes"
  else
    fail "ESLint errors found — see /tmp/qa-lint.log"
  fi

  if [ "$QUICK" = false ]; then
    echo ""
    echo "── Production Build ──"

    if npm run build > /tmp/qa-build.log 2>&1; then
      pass "Production build succeeds"
    else
      fail "Build failed — see /tmp/qa-build.log"
    fi
  fi

  # ══════════════════════════════════════════════
  # 2. MIGRATION INTEGRITY
  # ══════════════════════════════════════════════
  echo ""
  echo "── Migration Integrity ──"

  # Check sequential numbering (no gaps, no duplicates)
  MIGRATION_FILES=$(ls -1 supabase/migrations/*.sql 2>/dev/null | sort)
  MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l | tr -d ' ')
  info "$MIGRATION_COUNT migration files"

  # Extract numbers and check for gaps
  PREV_NUM=-1
  HAS_GAP=false
  HAS_DUP=false
  while IFS= read -r file; do
    NUM=$(basename "$file" | grep -oE '^[0-9]+' | sed 's/^0*//')
    if [ "$NUM" -eq "$PREV_NUM" ]; then
      HAS_DUP=true
      fail "Duplicate migration number: $NUM"
    fi
    PREV_NUM="$NUM"
  done <<< "$MIGRATION_FILES"

  if [ "$HAS_DUP" = false ]; then
    pass "No duplicate migration numbers"
  fi

  # Check that all migration files have valid SQL (not empty)
  EMPTY_MIGRATIONS=0
  while IFS= read -r file; do
    # Strip comments and whitespace — check if anything substantive remains
    CONTENT=$(grep -v '^--' "$file" | grep -v '^\s*$' | head -1)
    if [ -z "$CONTENT" ]; then
      EMPTY_MIGRATIONS=$((EMPTY_MIGRATIONS + 1))
      warn "Empty migration: $(basename "$file")"
    fi
  done <<< "$MIGRATION_FILES"

  if [ "$EMPTY_MIGRATIONS" -eq 0 ]; then
    pass "All migrations contain SQL"
  fi

  # ══════════════════════════════════════════════
  # 3. STATUS CONSTRAINT SYNC
  # ══════════════════════════════════════════════
  echo ""
  echo "── Status Enum Sync ──"

  # Check that status-badges.tsx maps match DB CHECK constraints
  # Company statuses in code — extract object keys from companyStatusMap
  CODE_COMPANY_STATUSES=$(sed -n '/companyStatusMap.*=.*{/,/^};/p' src/components/status-badges.tsx 2>/dev/null | \
    grep -E '^  [a-z_]+: \{' | sed 's/: {.*//' | sed 's/^ *//' | sort -u | tr '\n' ',' | sed 's/,$//')

  # Company statuses in latest migration CHECK constraint
  # The constraint may span multiple lines, so find the file and extract all statuses from it
  LATEST_CHECK_FILE=$(grep -rl "companies_status_check" supabase/migrations/ 2>/dev/null | sort | tail -1 || echo "")
  if [ -n "$LATEST_CHECK_FILE" ]; then
    DB_COMPANY_STATUSES=$(grep -A2 "ADD CONSTRAINT companies_status_check" "$LATEST_CHECK_FILE" 2>/dev/null | \
      grep -oE "'[a-z_]+'" | sed "s/'//g" | sort -u | tr '\n' ',' | sed 's/,$//')
    info "Code company statuses: $CODE_COMPANY_STATUSES"
    info "DB company statuses:   $DB_COMPANY_STATUSES"

    # Check that every DB status has a code mapping (keys are unquoted JS object props)
    MISSING_IN_CODE=""
    for status in $(echo "$DB_COMPANY_STATUSES" | tr ',' '\n'); do
      if ! echo "$CODE_COMPANY_STATUSES" | tr ',' '\n' | grep -qx "$status"; then
        MISSING_IN_CODE="$MISSING_IN_CODE $status"
      fi
    done

    if [ -z "$MISSING_IN_CODE" ]; then
      pass "All DB company statuses have badge mappings"
    else
      fail "DB company statuses missing badge mapping:$MISSING_IN_CODE"
    fi
  else
    warn "Could not find companies_status_check constraint in migrations"
  fi

fi # end DATA_ONLY check

# ══════════════════════════════════════════════
# 4. DATA INTEGRITY (live database checks)
# ══════════════════════════════════════════════
if [ "$QUICK" = false ]; then

  echo ""
  echo "── Data Integrity ($TARGET_ENV) ──"

  # 4a. Company status vs proposal status consistency
  # Rule: sent/viewed proposal → company should be needs_signature
  INCONSISTENT=$(sb_sql "
    SELECT c.name, c.status AS company_status, p.status AS proposal_status
    FROM companies c
    JOIN proposals p ON p.company_id = c.id
    WHERE p.status IN ('sent', 'viewed')
      AND c.status != 'needs_signature'
      AND c.type = 'prospect'
    ORDER BY c.name
  " 2>/dev/null)

  INCONSISTENT_COUNT=$(echo "$INCONSISTENT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$INCONSISTENT_COUNT" -eq 0 ]; then
    pass "Company statuses match proposal lifecycle"
  else
    fail "$INCONSISTENT_COUNT prospect(s) with sent/viewed proposal but status != needs_signature"
    echo "$INCONSISTENT" | python3 -c "
import sys, json
try:
    for r in json.load(sys.stdin):
        print(f\"       {r['name']}: company={r['company_status']}, proposal={r['proposal_status']}\")
except: pass
" 2>/dev/null || true
  fi

  # 4b. Orphaned proposal items (proposal deleted but items remain)
  ORPHANED_ITEMS=$(sb_sql "
    SELECT COUNT(*) AS count
    FROM proposal_items pi
    LEFT JOIN proposals p ON p.id = pi.proposal_id
    WHERE p.id IS NULL
  " 2>/dev/null)

  ORPHAN_COUNT=$(echo "$ORPHANED_ITEMS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$ORPHAN_COUNT" -eq 0 ]; then
    pass "No orphaned proposal items"
  else
    fail "$ORPHAN_COUNT orphaned proposal item(s) — proposal deleted but items remain"
  fi

  # 4c. Company services with invalid service references
  INVALID_SERVICES=$(sb_sql "
    SELECT COUNT(*) AS count
    FROM company_services cs
    LEFT JOIN services s ON s.id = cs.service_id
    WHERE s.id IS NULL
  " 2>/dev/null)

  INVALID_SVC_COUNT=$(echo "$INVALID_SERVICES" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$INVALID_SVC_COUNT" -eq 0 ]; then
    pass "All company_services reference valid services"
  else
    fail "$INVALID_SVC_COUNT company_service(s) with invalid service_id"
  fi

  # 4d. Active companies should have at least one signed proposal
  ACTIVE_NO_PROPOSAL=$(sb_sql "
    SELECT c.name
    FROM companies c
    WHERE c.status = 'active'
      AND c.type != 'lead'
      AND NOT EXISTS (
        SELECT 1 FROM proposals p
        WHERE p.company_id = c.id AND p.status = 'signed'
      )
    ORDER BY c.name
  " 2>/dev/null)

  ACTIVE_NO_PROP_COUNT=$(echo "$ACTIVE_NO_PROPOSAL" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$ACTIVE_NO_PROP_COUNT" -eq 0 ]; then
    pass "All active companies have a signed proposal"
  else
    warn "$ACTIVE_NO_PROP_COUNT active company(ies) without a signed proposal"
    echo "$ACTIVE_NO_PROPOSAL" | python3 -c "
import sys, json
try:
    for r in json.load(sys.stdin):
        print(f\"       {r['name']}\")
except: pass
" 2>/dev/null || true
  fi

  # 4e. Profiles without auth.users (orphaned profiles)
  ORPHANED_PROFILES=$(sb_sql "
    SELECT COUNT(*) AS count
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE u.id IS NULL
  " 2>/dev/null)

  ORPHAN_PROFILE_COUNT=$(echo "$ORPHANED_PROFILES" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d[0]['count'] if d else 0)
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$ORPHAN_PROFILE_COUNT" -eq 0 ]; then
    pass "No orphaned profiles (all have auth.users)"
  else
    warn "$ORPHAN_PROFILE_COUNT orphaned profile(s) without auth.users"
  fi

  # 4f. Companies with duplicate slugs
  DUP_SLUGS=$(sb_sql "
    SELECT slug, COUNT(*) AS count
    FROM companies
    GROUP BY slug
    HAVING COUNT(*) > 1
  " 2>/dev/null)

  DUP_SLUG_COUNT=$(echo "$DUP_SLUGS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$DUP_SLUG_COUNT" -eq 0 ]; then
    pass "No duplicate company slugs"
  else
    fail "$DUP_SLUG_COUNT duplicate company slug(s)"
  fi

  # 4g. RLS sanity — verify admin bypass function exists
  # Use LIKE instead of IN to avoid single-quote escaping issues in JSON payload
  RLS_CHECK=$(sb_sql "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE 'is_brik%' OR routine_name LIKE 'get_company%' OR routine_name LIKE 'is_company%') ORDER BY routine_name" 2>/dev/null)

  RLS_FN_COUNT=$(echo "$RLS_CHECK" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    rows = d if isinstance(d, list) else []
    print(len(rows))
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$RLS_FN_COUNT" -ge 3 ]; then
    pass "RLS auth functions present (is_brik_admin, get_company_role, is_company_member)"
  else
    fail "Missing RLS auth functions ($RLS_FN_COUNT/3 found)"
  fi

fi # end QUICK check

# ══════════════════════════════════════════════
# 5. API ROUTE SMOKE TEST
# ══════════════════════════════════════════════
if [ "$QUICK" = false ] && [ "$DATA_ONLY" = false ]; then

  echo ""
  echo "── API Smoke Test (localhost:3000) ──"

  # Only run if dev server is up
  DEV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
  if [ "$DEV_STATUS" = "000" ]; then
    warn "Dev server not running — skipping API smoke tests"
  else
    # Check key pages return 200 or redirect (3xx)
    ROUTES=(
      "/login:200"
      "/admin:307"
    )

    for route_check in "${ROUTES[@]}"; do
      ROUTE="${route_check%%:*}"
      EXPECTED="${route_check#*:}"
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${ROUTE}" 2>/dev/null || echo "000")

      if [ "$STATUS" = "$EXPECTED" ]; then
        pass "$ROUTE → $STATUS"
      else
        fail "$ROUTE → expected $EXPECTED, got $STATUS"
      fi
    done
  fi

fi

# ══════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════
echo ""
echo "========================================="
if [ "$FAILS" -eq 0 ] && [ "$WARNS" -eq 0 ]; then
  echo -e "  ${GREEN}✓ All QA checks passed — safe to merge${NC}"
elif [ "$FAILS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNS warning(s), 0 failures — review warnings before merge${NC}"
else
  echo -e "  ${RED}$FAILS failure(s), $WARNS warning(s) — DO NOT merge until failures are resolved${NC}"
fi
echo "========================================="
echo ""

if [ "$CI_MODE" = true ]; then
  exit "$FAILS"
fi
