#!/usr/bin/env bash
set -euo pipefail

# Agent Preflight Check — Multi-Agent Coordination
#
# Run this BEFORE starting any work session. It:
#   1. Shows active workstreams (who's working on what)
#   2. Detects file ownership conflicts
#   3. Checks for in-flight branches that might collide
#   4. Claims a workstream slot for this session
#
# Usage:
#   ./scripts/agent-preflight.sh                          # Show status
#   ./scripts/agent-preflight.sh --claim "Add invoices"   # Claim a workstream
#   ./scripts/agent-preflight.sh --release                # Release your claim
#   ./scripts/agent-preflight.sh --list                   # List active workstreams
#
# The workstream manifest lives at .claude/workstreams.json (gitignored).
# It's a local coordination file — not pushed to remote.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$PROJECT_ROOT/.claude/workstreams.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

pass()  { echo -e "  ${GREEN}[OK]${NC}    $1"; }
fail()  { echo -e "  ${RED}[WARN]${NC}  $1"; }
warn()  { echo -e "  ${YELLOW}[NOTE]${NC}  $1"; }
info()  { echo -e "  ${CYAN}[INFO]${NC}  $1"; }
dim()   { echo -e "  ${DIM}$1${NC}"; }

# ── Ensure manifest exists ──
init_manifest() {
  mkdir -p "$(dirname "$MANIFEST")"
  if [ ! -f "$MANIFEST" ]; then
    echo '{"workstreams": [], "shared_locks": []}' > "$MANIFEST"
  fi
}

# ── Parse args ──
ACTION="status"
CLAIM_DESC=""
CLAIM_FILES=""
CLAIM_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claim)
      ACTION="claim"
      CLAIM_DESC="${2:-}"
      shift 2 || { echo "ERROR: --claim requires a description"; exit 1; }
      ;;
    --files)
      CLAIM_FILES="${2:-}"
      shift 2 || { echo "ERROR: --files requires a path pattern"; exit 1; }
      ;;
    --branch)
      CLAIM_BRANCH="${2:-}"
      shift 2 || { echo "ERROR: --branch requires a branch name"; exit 1; }
      ;;
    --release)
      ACTION="release"
      shift
      ;;
    --release-all)
      ACTION="release-all"
      shift
      ;;
    --list)
      ACTION="list"
      shift
      ;;
    --stale)
      ACTION="stale"
      shift
      ;;
    --help|-h)
      echo "Usage: ./scripts/agent-preflight.sh [OPTIONS]"
      echo ""
      echo "  (default)                    Show status + conflict check"
      echo "  --claim \"description\"        Claim a workstream"
      echo "  --files \"src/app/admin/*\"    Files this workstream owns (with --claim)"
      echo "  --branch feat/thing          Branch for this workstream (with --claim)"
      echo "  --release                    Release your workstream claim"
      echo "  --release-all                Release all claims (cleanup)"
      echo "  --list                       List active workstreams"
      echo "  --stale                      Clean up stale workstreams (>4h old)"
      echo ""
      echo "Workstream manifest: .claude/workstreams.json (gitignored, local only)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

cd "$PROJECT_ROOT"
init_manifest

# ── Helpers ──

# Get a session identifier (PID-based, since each Claude Code instance has a unique PID tree)
get_session_id() {
  # Use parent PID as session identifier — each Claude Code terminal has a unique one
  echo "agent-$$"
}

now_epoch() {
  date +%s
}

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# ── Actions ──

do_list() {
  local count
  count=$(python3 -c "
import json, sys
with open('$MANIFEST') as f:
    d = json.load(f)
print(len(d.get('workstreams', [])))
" 2>/dev/null || echo "0")

  if [ "$count" -eq 0 ]; then
    info "No active workstreams"
    return
  fi

  echo ""
  echo "  Active workstreams ($count):"
  echo ""

  python3 -c "
import json, sys
from datetime import datetime, timezone

with open('$MANIFEST') as f:
    d = json.load(f)

for i, w in enumerate(d.get('workstreams', [])):
    desc = w.get('description', '(no description)')
    branch = w.get('branch', '(no branch)')
    files = ', '.join(w.get('files', [])) or '(no file claims)'
    started = w.get('started_at', '?')
    sid = w.get('session_id', '?')

    # Calculate age
    try:
        st = datetime.fromisoformat(started.replace('Z', '+00:00'))
        age = datetime.now(timezone.utc) - st
        hours = int(age.total_seconds() / 3600)
        mins = int((age.total_seconds() % 3600) / 60)
        age_str = f'{hours}h {mins}m ago'
    except:
        age_str = started

    print(f'  {i+1}. {desc}')
    print(f'     Branch: {branch}  |  Files: {files}')
    print(f'     Started: {age_str}  |  Session: {sid}')
    print()
" 2>/dev/null || echo "  (could not parse manifest)"
}

do_claim() {
  local session_id
  session_id=$(get_session_id)

  # Check for file ownership conflicts
  if [ -n "$CLAIM_FILES" ]; then
    local conflicts
    conflicts=$(python3 -c "
import json, sys

with open('$MANIFEST') as f:
    d = json.load(f)

claim_patterns = '$CLAIM_FILES'.split(',')
for w in d.get('workstreams', []):
    for existing in w.get('files', []):
        for new in claim_patterns:
            new = new.strip()
            # Simple prefix overlap check
            if existing.startswith(new.rstrip('*').rstrip('/')) or new.rstrip('*').rstrip('/').startswith(existing.rstrip('*').rstrip('/')):
                print(f'CONFLICT: \"{new}\" overlaps with \"{existing}\" (claimed by: {w[\"description\"]})')
" 2>/dev/null || echo "")

    if [ -n "$conflicts" ]; then
      echo ""
      echo -e "  ${RED}File ownership conflicts detected:${NC}"
      echo "$conflicts" | while read -r line; do echo "    $line"; done
      echo ""
      echo "  Options:"
      echo "    1. Coordinate with the other agent to avoid these files"
      echo "    2. Use a feature branch for isolation (--branch flag)"
      echo "    3. Wait for the other workstream to complete"
      echo ""
      return 1
    fi
  fi

  # Add claim
  python3 -c "
import json

with open('$MANIFEST') as f:
    d = json.load(f)

files = [f.strip() for f in '$CLAIM_FILES'.split(',') if f.strip()] if '$CLAIM_FILES' else []

d['workstreams'].append({
    'session_id': '$session_id',
    'description': '''$CLAIM_DESC''',
    'branch': '$CLAIM_BRANCH' or '$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")',
    'files': files,
    'started_at': '$(now_iso)'
})

with open('$MANIFEST', 'w') as f:
    json.dump(d, f, indent=2)
" 2>/dev/null

  pass "Claimed workstream: $CLAIM_DESC"
  if [ -n "$CLAIM_FILES" ]; then info "File ownership: $CLAIM_FILES"; fi
  if [ -n "$CLAIM_BRANCH" ]; then info "Branch: $CLAIM_BRANCH"; fi
}

do_release() {
  local session_id
  session_id=$(get_session_id)

  python3 -c "
import json

with open('$MANIFEST') as f:
    d = json.load(f)

before = len(d['workstreams'])
d['workstreams'] = [w for w in d['workstreams'] if w.get('session_id') != '$session_id']
after = len(d['workstreams'])

with open('$MANIFEST', 'w') as f:
    json.dump(d, f, indent=2)

released = before - after
if released > 0:
    print(f'Released {released} workstream(s)')
else:
    print('No workstreams found for this session')
" 2>/dev/null
}

do_release_all() {
  echo '{"workstreams": [], "shared_locks": []}' > "$MANIFEST"
  pass "All workstreams released"
}

do_stale() {
  python3 -c "
import json
from datetime import datetime, timezone, timedelta

with open('$MANIFEST') as f:
    d = json.load(f)

cutoff = datetime.now(timezone.utc) - timedelta(hours=4)
before = len(d['workstreams'])

active = []
stale = []
for w in d['workstreams']:
    try:
        st = datetime.fromisoformat(w['started_at'].replace('Z', '+00:00'))
        if st < cutoff:
            stale.append(w)
        else:
            active.append(w)
    except:
        active.append(w)

d['workstreams'] = active

with open('$MANIFEST', 'w') as f:
    json.dump(d, f, indent=2)

if stale:
    print(f'Cleaned up {len(stale)} stale workstream(s):')
    for w in stale:
        print(f'  - {w[\"description\"]} (started {w[\"started_at\"]})')
else:
    print('No stale workstreams found')
" 2>/dev/null
}

do_status() {
  echo ""
  echo "========================================="
  echo "  Agent Preflight Check"
  echo "  $(date '+%Y-%m-%d %H:%M')"
  echo "========================================="

  # 1. Current branch
  echo ""
  echo "── Branch Status ──"
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  info "Current branch: $CURRENT_BRANCH"

  # Uncommitted changes
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    warn "$DIRTY_COUNT uncommitted change(s) — another agent may have left WIP"
  else
    pass "Working tree clean"
  fi

  # 2. Active feature branches (potential collisions)
  echo ""
  echo "── Active Branches ──"
  FEATURE_BRANCHES=$(git branch -r 2>/dev/null | grep -E 'origin/(feat|fix|refactor)/' | sed 's|origin/||' | tr -d ' ' || echo "")
  if [ -n "$FEATURE_BRANCHES" ]; then
    warn "Active feature branches:"
    echo "$FEATURE_BRANCHES" | while read -r b; do
      LAST_COMMIT=$(git log -1 --format='%ar by %an' "origin/$b" 2>/dev/null || echo "unknown")
      dim "    $b ($LAST_COMMIT)"
    done
  else
    pass "No active feature branches"
  fi

  # 3. Active workstreams
  echo ""
  echo "── Workstreams ──"
  do_list

  # 4. Recent pushes (detect rapid-fire pushing)
  echo ""
  echo "── Recent Activity ──"
  LAST_PUSH_BRANCH=$(git log -1 --format='%ar' "origin/$CURRENT_BRANCH" 2>/dev/null || echo "unknown")
  info "Last push to $CURRENT_BRANCH: $LAST_PUSH_BRANCH"

  # Check if another agent pushed recently (< 5 min ago)
  LAST_PUSH_EPOCH=$(git log -1 --format='%ct' "origin/$CURRENT_BRANCH" 2>/dev/null || echo "0")
  NOW_EPOCH=$(now_epoch)
  PUSH_AGE=$(( NOW_EPOCH - LAST_PUSH_EPOCH ))
  if [ "$PUSH_AGE" -lt 300 ]; then
    warn "Last push was < 5 minutes ago — wait for Netlify build to finish before pushing"
  fi

  # 5. Migration state
  echo ""
  echo "── Migration Safety ──"
  LATEST_MIGRATION=$(ls -1 supabase/migrations/*.sql 2>/dev/null | sort | tail -1 | xargs basename 2>/dev/null || echo "none")
  info "Latest migration: $LATEST_MIGRATION"
  LATEST_NUM=$(echo "$LATEST_MIGRATION" | sed 's/_.*//' || echo "0")
  NEXT_NUM=$(printf "%05d" $((10#$LATEST_NUM + 1)))
  info "Next available number: $NEXT_NUM"

  # 6. Summary
  echo ""
  echo "========================================="
  echo -e "  ${GREEN}Preflight complete${NC}"
  echo ""
  echo "  To claim a workstream:"
  echo "    ./scripts/agent-preflight.sh --claim \"description\" --files \"src/app/admin/companies/*\""
  echo ""
  echo "  To release when done:"
  echo "    ./scripts/agent-preflight.sh --release"
  echo "========================================="
  echo ""
}

# ── Dispatch ──
case "$ACTION" in
  status)      do_status ;;
  claim)       do_claim ;;
  release)     do_release ;;
  release-all) do_release_all ;;
  list)        do_list ;;
  stale)       do_stale ;;
esac
