#!/usr/bin/env bash
# Sync "Services Included" relations from Notion Service Catalog → Supabase service_bundle_items.
# Only syncs the 3 monthly support bundles (Marketing, Back Office, Product).
#
# Usage:
#   ./scripts/sync-bundle-items.sh              # Sync to staging (default)
#   ./scripts/sync-bundle-items.sh --prod       # Sync to production
#   ./scripts/sync-bundle-items.sh --dry-run    # Preview without writing
#
# Requires: NOTION_TOKEN, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL in .env.local

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DRY_RUN=false
TARGET="staging"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --prod)    TARGET="production" ;;
  esac
done

# Load env
if [[ -f "$PROJECT_DIR/.env.local" ]]; then
  set -a; source "$PROJECT_DIR/.env.local"; set +a
fi

NOTION_TOKEN="${NOTION_TOKEN:?Missing NOTION_TOKEN}"

if [[ "$TARGET" == "production" ]]; then
  SUPABASE_URL="${SUPABASE_PROD_URL:-${NEXT_PUBLIC_SUPABASE_URL}}"
  SERVICE_KEY="${SUPABASE_PROD_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"
  echo "⚠️  Targeting PRODUCTION"
else
  SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:?Missing NEXT_PUBLIC_SUPABASE_URL}"
  SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY}"
  echo "→ Targeting staging"
fi

NOTION_API="https://api.notion.com/v1"
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# The 3 monthly support bundle Notion page IDs
BUNDLE_NOTION_IDS=(
  "2e397d34-ed28-8000-b49f-d4c56c3c034c"  # Marketing Support
  "2e397d34-ed28-805a-b0f5-d027f5026f8c"  # Back Office Support
  "2e397d34-ed28-8097-bcee-e5d56536cf1e"  # Product Support
)

# Step 1: Fetch all services from Supabase (notion_page_id → id mapping)
echo "→ Fetching services from Supabase..."
curl -s "${SUPABASE_URL}/rest/v1/services?select=id,name,notion_page_id&notion_page_id=not.is.null" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > "$TMP_DIR/services.json"

SERVICE_COUNT=$(python3 -c "import json; print(len(json.load(open('$TMP_DIR/services.json'))))")
echo "  Found ${SERVICE_COUNT} services with notion_page_id"

# Step 2: For each bundle, fetch from Notion API and extract children
echo "" > "$TMP_DIR/all_inserts.json"
echo "[]" > "$TMP_DIR/all_inserts.json"

for BUNDLE_NOTION_ID in "${BUNDLE_NOTION_IDS[@]}"; do
  echo "→ Fetching bundle: ${BUNDLE_NOTION_ID}..."

  curl -s "${NOTION_API}/pages/${BUNDLE_NOTION_ID}" \
    -H "Authorization: Bearer ${NOTION_TOKEN}" \
    -H "Notion-Version: 2022-06-28" > "$TMP_DIR/page_${BUNDLE_NOTION_ID}.json"

  # Parse and map child relations to Supabase IDs
  python3 - "$TMP_DIR/page_${BUNDLE_NOTION_ID}.json" "$TMP_DIR/services.json" "$TMP_DIR/all_inserts.json" <<'PYEOF'
import json, sys

page_file, services_file, inserts_file = sys.argv[1], sys.argv[2], sys.argv[3]

with open(page_file) as f:
    page = json.load(f)
with open(services_file) as f:
    services = json.load(f)
with open(inserts_file) as f:
    all_inserts = json.load(f)

# Build notion_page_id → supabase_id lookup
lookup = {s['notion_page_id']: s['id'] for s in services if s.get('notion_page_id')}
name_lookup = {s['notion_page_id']: s['name'] for s in services if s.get('notion_page_id')}

# Get parent Supabase ID
parent_notion_id = page['id']
parent_id = lookup.get(parent_notion_id)
if not parent_id:
    print(f"  ⚠ Bundle {parent_notion_id} not found in Supabase — skipping")
    sys.exit(0)

# Get title
props = page.get('properties', {})
title_prop = props.get('Service Name', {}).get('title', [])
title = title_prop[0]['plain_text'] if title_prop else 'Unknown'

# Get Services Included relation
included = props.get('Services Included', {}).get('relation', [])
matched = 0
missed = 0

for i, rel in enumerate(included):
    child_notion_id = rel['id']
    child_id = lookup.get(child_notion_id)
    if child_id and child_id != parent_id:
        all_inserts.append({
            'parent_service_id': parent_id,
            'child_service_id': child_id,
            'sort_order': i,
        })
        matched += 1
    else:
        missed += 1

print(f"  {title}: {matched} matched, {missed} unmatched")

with open(inserts_file, 'w') as f:
    json.dump(all_inserts, f)
PYEOF
done

TOTAL=$(python3 -c "import json; print(len(json.load(open('$TMP_DIR/all_inserts.json'))))")
echo ""
echo "→ Total bundle items to sync: ${TOTAL}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "[DRY RUN] Would insert ${TOTAL} rows into service_bundle_items"
  python3 -c "
import json
items = json.load(open('$TMP_DIR/all_inserts.json'))
for item in items:
    print(f'  {item[\"parent_service_id\"]} → {item[\"child_service_id\"]} (sort: {item[\"sort_order\"]})')
"
  exit 0
fi

if [[ "$TOTAL" == "0" ]]; then
  echo "Nothing to sync."
  exit 0
fi

# Step 3: Clear existing bundle items for these parents
echo "→ Clearing existing bundle items for synced parents..."
python3 - "$TMP_DIR/services.json" <<PYEOF2
import json

services = json.load(open("$TMP_DIR/services.json"))
lookup = {s['notion_page_id']: s['id'] for s in services if s.get('notion_page_id')}

bundle_ids = ["2e397d34-ed28-8000-b49f-d4c56c3c034c", "2e397d34-ed28-805a-b0f5-d027f5026f8c", "2e397d34-ed28-8097-bcee-e5d56536cf1e"]
parent_ids = [lookup[nid] for nid in bundle_ids if nid in lookup]

with open("$TMP_DIR/parent_ids.json", "w") as f:
    json.dump(parent_ids, f)
PYEOF2

# Delete existing rows for each parent
while IFS= read -r PARENT_ID; do
  curl -s -X DELETE "${SUPABASE_URL}/rest/v1/service_bundle_items?parent_service_id=eq.${PARENT_ID}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" > /dev/null
done < <(python3 -c "import json; [print(pid) for pid in json.load(open('$TMP_DIR/parent_ids.json'))]")

# Step 4: Insert all bundle items
echo "→ Inserting ${TOTAL} bundle items..."
HTTP_CODE=$(curl -s -o "$TMP_DIR/response_body.txt" -w "%{http_code}" -X POST "${SUPABASE_URL}/rest/v1/service_bundle_items" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=minimal" \
  -d @"$TMP_DIR/all_inserts.json")

BODY=$(cat "$TMP_DIR/response_body.txt")

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "✅ Synced ${TOTAL} bundle items successfully"
else
  echo "❌ Failed (HTTP ${HTTP_CODE}): ${BODY}"
  exit 1
fi
