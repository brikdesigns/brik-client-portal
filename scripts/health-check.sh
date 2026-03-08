#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Infrastructure Health Check
# Verifies all external services, secrets, and environment config.
#
# Usage:
#   ./scripts/health-check.sh          # Full check (interactive)
#   ./scripts/health-check.sh --ci     # CI mode (non-interactive, exit code = fail count)
#   ./scripts/health-check.sh --quick  # Quick check (skip build, skip Netlify)
#
# Run this:
#   - At the start of every work session
#   - After rotating any credentials
#   - When CI starts failing unexpectedly

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

for arg in "$@"; do
  case "$arg" in
    --ci)    CI_MODE=true ;;
    --quick) QUICK=true ;;
    --help|-h)
      echo "Usage: ./scripts/health-check.sh [--ci|--quick]"
      echo ""
      echo "  (default)    Full interactive health check"
      echo "  --ci         CI mode (non-interactive, exit code = fail count)"
      echo "  --quick      Skip build check and Netlify API calls"
      exit 0
      ;;
  esac
done

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[FAIL]${NC}  $1"; FAILS=$((FAILS + 1)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC}  $1"; WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

cd "$PROJECT_ROOT"

echo ""
echo "========================================="
echo "  Brik Client Portal — Health Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="

# ── 1. Local environment ──
echo ""
echo "── Local Environment ──"

if [ -f ".env.local" ]; then
  pass ".env.local exists"
else
  fail ".env.local missing — app won't start"
fi

# Check required env vars
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_DB_PASSWORD
  SUPABASE_STAGING_PROJECT_REF
)
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^${var}=" .env.local 2>/dev/null; then
    pass "$var set"
  else
    fail "$var missing from .env.local"
  fi
done

# ── 2. Supabase connectivity ──
echo ""
echo "── Supabase Production ──"

if [ -f ".env.local" ]; then
  source .env.local 2>/dev/null || true

  PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" 2>/dev/null || echo "000")

  if [ "$PROD_STATUS" = "200" ]; then
    pass "REST API responding (HTTP $PROD_STATUS)"
  else
    fail "REST API unreachable (HTTP $PROD_STATUS)"
  fi

  # Check admin user exists
  ADMIN_CHECK=$(curl -s \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.4c444a10-8cd6-49e2-8f31-434a3c51e8d1&select=role" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" 2>/dev/null)

  if echo "$ADMIN_CHECK" | grep -q '"admin"'; then
    pass "Admin user (nick@brikdesigns.com) exists with admin role"
  else
    fail "Admin user missing or wrong role"
  fi
fi

echo ""
echo "── Supabase Staging ──"

if [ -n "${SUPABASE_STAGING_PROJECT_REF:-}" ]; then
  STG_URL="https://${SUPABASE_STAGING_PROJECT_REF}.supabase.co"
  STG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "${STG_URL}/rest/v1/" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" 2>/dev/null || echo "000")

  # Staging uses different keys — just check the URL resolves
  STG_PING=$(curl -s -o /dev/null -w "%{http_code}" "${STG_URL}" 2>/dev/null || echo "000")
  if [ "$STG_PING" != "000" ]; then
    pass "Staging project reachable ($STG_URL)"
  else
    fail "Staging project unreachable ($STG_URL)"
  fi
else
  fail "SUPABASE_STAGING_PROJECT_REF not set in .env.local"
fi

# ── 3. GitHub secrets ──
echo ""
echo "── GitHub Secrets ──"

if command -v gh &> /dev/null; then
  SECRETS=$(gh secret list --repo brikdesigns/brik-client-portal 2>/dev/null || echo "")

  REQUIRED_SECRETS=(
    SUPABASE_ACCESS_TOKEN
    SUPABASE_DB_PASSWORD
    SUPABASE_STAGING_PROJECT_REF
    SUPABASE_STAGING_DB_PASSWORD
  )
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS" | grep -q "^$secret"; then
      UPDATED=$(echo "$SECRETS" | grep "^$secret" | awk '{print $2}')
      pass "$secret (updated $UPDATED)"
    else
      fail "$secret missing"
    fi
  done
else
  warn "gh CLI not available — skipping GitHub secrets check"
fi

# ── 4. Netlify env vars ──
if [ "$QUICK" = false ]; then
  echo ""
  echo "── Netlify Environment ──"

  NETLIFY_TOKEN="${NETLIFY_ACCESS_TOKEN:-}"
  SITE_ID="902a0eb4-00bb-4cd7-b45b-f31f1358076b"

  if [ -n "$NETLIFY_TOKEN" ]; then
    NETLIFY_ENVS=$(curl -s "https://api.netlify.com/api/v1/accounts/brikdesigns/env?site_id=$SITE_ID" \
      -H "Authorization: Bearer $NETLIFY_TOKEN" 2>/dev/null)

    # Check staging-scoped vars exist
    SCOPED_VARS=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY)
    for var in "${SCOPED_VARS[@]}"; do
      HAS_STAGING=$(echo "$NETLIFY_ENVS" | python3 -c "
import sys, json
envs = json.load(sys.stdin)
for e in envs:
    if e['key'] == '$var':
        for v in e.get('values', []):
            if v.get('context_parameter') == 'staging':
                print('yes')
                break
" 2>/dev/null || echo "")

      if [ "$HAS_STAGING" = "yes" ]; then
        pass "$var has staging branch scope"
      else
        fail "$var missing staging branch scope — staging deploy will use prod DB!"
      fi
    done
  else
    warn "NETLIFY_ACCESS_TOKEN not in .env.local — skipping Netlify check"
  fi
fi

# ── 5. CI status ──
echo ""
echo "── CI Pipeline ──"

if command -v gh &> /dev/null; then
  LAST_RUN=$(gh run list --workflow=migrate.yml --limit=1 --json conclusion,headBranch,createdAt 2>/dev/null || echo "[]")
  CONCLUSION=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['conclusion'] if d else 'unknown')" 2>/dev/null || echo "unknown")
  BRANCH=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['headBranch'] if d else '?')" 2>/dev/null || echo "?")
  WHEN=$(echo "$LAST_RUN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['createdAt'][:10] if d else '?')" 2>/dev/null || echo "?")

  if [ "$CONCLUSION" = "success" ]; then
    pass "Last migration CI: success ($BRANCH, $WHEN)"
  elif [ "$CONCLUSION" = "failure" ]; then
    fail "Last migration CI: FAILED ($BRANCH, $WHEN) — check secrets!"
  else
    warn "Last migration CI: $CONCLUSION ($BRANCH, $WHEN)"
  fi
fi

# ── 6. Build check ──
if [ "$QUICK" = false ]; then
  echo ""
  echo "── Build ──"

  if npm run build > /tmp/portal-build.log 2>&1; then
    pass "Production build passes"
  else
    fail "Build failed — check /tmp/portal-build.log"
  fi
fi

# ── 7. Migration sync ──
echo ""
echo "── Migration Sync ──"

LOCAL_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
info "$LOCAL_COUNT migration files in supabase/migrations/"

# Check APPLIED_MIGRATIONS list matches migration count
APPLIED_COUNT=$(grep -oE '000[0-9]{2}' .github/workflows/migrate.yml 2>/dev/null | wc -l | tr -d ' ')
if [ "$APPLIED_COUNT" = "$LOCAL_COUNT" ]; then
  pass "APPLIED_MIGRATIONS list matches migration count ($APPLIED_COUNT)"
else
  warn "APPLIED_MIGRATIONS has $APPLIED_COUNT entries but $LOCAL_COUNT migrations exist"
  dim "New migrations will auto-apply via CI — this is only an issue if you applied manually"
fi

# ── Summary ──
echo ""
echo "========================================="
if [ "$FAILS" -eq 0 ] && [ "$WARNS" -eq 0 ]; then
  echo -e "  ${GREEN}All checks passed${NC}"
elif [ "$FAILS" -eq 0 ]; then
  echo -e "  ${YELLOW}$WARNS warning(s), 0 failures${NC}"
else
  echo -e "  ${RED}$FAILS failure(s), $WARNS warning(s)${NC}"
fi
echo "========================================="
echo ""

if [ "$CI_MODE" = true ]; then
  exit "$FAILS"
fi
