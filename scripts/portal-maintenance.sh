#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Weekly maintenance check
# Run from project root: ./scripts/portal-maintenance.sh

PORTAL_URL="${PORTAL_URL:-https://portal.brikdesigns.com}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}[OK]${NC}  $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; }

echo ""
echo "========================================="
echo "  Brik Portal Maintenance Check"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================="

# 1. Health endpoint
echo ""
echo "1. Health endpoint"
HEALTH=$(curl -sf "${PORTAL_URL}/api/health" 2>/dev/null || echo "UNREACHABLE")
if [ "$HEALTH" = "UNREACHABLE" ]; then
  fail "Cannot reach ${PORTAL_URL}/api/health"
else
  STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
  LATENCY=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['latency_ms'])" 2>/dev/null || echo "?")
  VERSION=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "?")
  if [ "$STATUS" = "ok" ]; then
    pass "Portal healthy (v${VERSION}, ${LATENCY}ms)"
  else
    warn "Portal degraded — status: ${STATUS}"
    echo "       $HEALTH"
  fi
fi

# 2. Build check
echo ""
echo "2. Build check"
BUILD_OUT=$(npm run build 2>&1)
if [ $? -eq 0 ]; then
  pass "Build succeeded"
  # Show page sizes
  echo "$BUILD_OUT" | grep -E "^(Route|├|└|┌|│|First)" | tail -8 || true
else
  fail "Build failed"
  echo "$BUILD_OUT" | tail -10
fi

# 3. Lint check
echo ""
echo "3. Lint check"
LINT_OUT=$(npm run lint 2>&1)
if [ $? -eq 0 ]; then
  pass "No lint errors"
else
  warn "Lint issues found"
  echo "$LINT_OUT" | tail -5
fi

# 4. Dependency audit
echo ""
echo "4. Dependency audit"
AUDIT_OUT=$(npm audit --audit-level=moderate 2>&1 || true)
VULN_COUNT=$(echo "$AUDIT_OUT" | grep -oE '[0-9]+ vulnerabilities' | head -1 || echo "")
if echo "$AUDIT_OUT" | grep -q "found 0 vulnerabilities"; then
  pass "No known vulnerabilities"
elif [ -n "$VULN_COUNT" ]; then
  warn "$VULN_COUNT"
else
  pass "Audit clean"
fi

# 5. BDS submodule status
echo ""
echo "5. BDS submodule"
SUB_STATUS=$(git submodule status 2>/dev/null | head -1)
if [ -n "$SUB_STATUS" ]; then
  BEHIND=$(echo "$SUB_STATUS" | grep -c "^+" || true)
  if [ "$BEHIND" -gt 0 ]; then
    warn "Submodule has local changes — consider updating"
  else
    pass "Submodule in sync"
  fi
  echo "       $SUB_STATUS"
else
  warn "No submodule found"
fi

# 6. SSL certificate
echo ""
echo "6. SSL certificate"
DOMAIN=$(echo "$PORTAL_URL" | sed 's|https://||' | sed 's|/.*||')
EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -jf "%b %d %H:%M:%S %Y %Z" "$EXPIRY" "+%s" 2>/dev/null || date -d "$EXPIRY" "+%s" 2>/dev/null || echo "0")
  NOW_EPOCH=$(date "+%s")
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -gt 30 ]; then
    pass "Expires in ${DAYS_LEFT} days ($EXPIRY)"
  elif [ "$DAYS_LEFT" -gt 7 ]; then
    warn "Expires in ${DAYS_LEFT} days — renew soon"
  else
    fail "Expires in ${DAYS_LEFT} days — URGENT"
  fi
else
  warn "Could not check SSL (offline?)"
fi

# 7. Git status
echo ""
echo "7. Working tree"
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIRTY" -eq 0 ]; then
  pass "Clean working tree"
else
  warn "${DIRTY} uncommitted changes"
fi

# 8. Token compliance (quick summary)
echo ""
echo "8. Design token compliance"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -x "${SCRIPT_DIR}/token-audit.sh" ]; then
  TOKEN_OUT=$("${SCRIPT_DIR}/token-audit.sh" 2>&1 || true)
  TOKEN_TOTAL=$(echo "$TOKEN_OUT" | grep "Total violations" | grep -oE '[0-9]+' || echo "0")
  if [ "$TOKEN_TOTAL" = "0" ]; then
    pass "No token violations"
  else
    warn "${TOKEN_TOTAL} token violations (run npm run audit:tokens for details)"
  fi
else
  warn "Token audit script not found"
fi

echo ""
echo "========================================="
echo "  Done"
echo "========================================="
echo ""
