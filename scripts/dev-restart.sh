#!/usr/bin/env bash
# dev-restart.sh — Clean restart of Next.js dev server
# Kills ALL Next.js processes (parent + child workers), purges caches, starts fresh.
# Usage: ./scripts/dev-restart.sh [--no-cache]
#   --no-cache  Also purge node_modules/.cache (for BDS/token changes)

set -euo pipefail
cd "$(dirname "$0")/.."

PURGE_NODE_CACHE=false
[[ "${1:-}" == "--no-cache" ]] && PURGE_NODE_CACHE=true

# 1. Kill ALL Next.js-related processes — parent AND child workers
#    "next dev" catches the parent, "next-server" and "next-router" catch workers
echo "→ Killing all Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next-router" 2>/dev/null || true

# 2. Fallback: kill anything still holding port 3000
#    Catches edge cases where process names don't match (e.g. node binary path)
sleep 0.5
PORT_PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [[ -n "$PORT_PIDS" ]]; then
  echo "→ Port 3000 still held by PID(s): $PORT_PIDS — force-killing..."
  echo "$PORT_PIDS" | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

# 3. Verify port is actually free
if lsof -i :3000 -sTCP:LISTEN &>/dev/null; then
  echo "✗ Port 3000 still in use after cleanup. Check manually: lsof -i :3000"
  exit 1
fi

# 4. Purge caches
echo "→ Purging .next cache..."
rm -rf .next

if [[ "$PURGE_NODE_CACHE" == true ]]; then
  echo "→ Purging node_modules/.cache..."
  rm -rf node_modules/.cache
fi

# 5. Start dev server
echo "→ Starting dev server..."
npm run dev &
DEV_PID=$!

# 6. Wait for server to be ready (up to 20s)
echo "→ Waiting for port 3000..."
for i in {1..20}; do
  if lsof -i :3000 -sTCP:LISTEN &>/dev/null; then
    ACTUAL_PID=$(lsof -ti :3000 -sTCP:LISTEN | head -1)
    echo "✓ Dev server running on http://localhost:3000 (PID: $ACTUAL_PID)"
    exit 0
  fi
  sleep 1
done

echo "✗ Server failed to start within 20s"
exit 1
