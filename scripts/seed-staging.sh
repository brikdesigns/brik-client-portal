#!/usr/bin/env bash
# seed-staging.sh — Export production data and seed staging Supabase
# Usage: ./scripts/seed-staging.sh [--dry-run]
#
# Exports all tables from production (via REST API) and inserts into staging
# via Supabase Management API. All inserts are idempotent (ON CONFLICT DO NOTHING).
#
# Requires: SUPABASE_ACCESS_TOKEN in .env.local or environment
#           Production service role key (hardcoded — read-only export)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
fi

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  echo "DRY RUN — SQL will be generated but not applied"
fi

# Production (read-only export source)
PROD_URL="https://rnspxmrkpoukccahggli.supabase.co"
PROD_REF="rnspxmrkpoukccahggli"
STAGING_REF="${SUPABASE_STAGING_PROJECT_REF:-lmhzpzobdkstzpvsqest}"

# Get production service role key from Management API
echo "→ Fetching production API keys..."
PROD_KEY=$(curl -s "https://api.supabase.com/v1/projects/$PROD_REF/api-keys" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | \
  python3 -c "import sys,json; keys=json.load(sys.stdin); print(next(k['api_key'] for k in keys if k['name']=='service_role'))")

if [ -z "$PROD_KEY" ]; then
  echo "ERROR: Could not fetch production service role key"
  exit 1
fi

echo "→ Exporting production data..."

TMPDIR=$(mktemp -d)
TABLES="service_categories services companies contacts company_users proposals proposal_items agreement_templates agreements projects invoices company_services report_sets reports report_items email_log"

for t in $TABLES; do
  curl -s "$PROD_URL/rest/v1/$t" \
    -H "apikey: $PROD_KEY" \
    -H "Authorization: Bearer $PROD_KEY" > "$TMPDIR/$t.json"
  count=$(python3 -c "import json; print(len(json.load(open('$TMPDIR/$t.json'))))")
  echo "  $t: $count rows"
done

echo "→ Generating seed SQL..."

python3 << PYEOF
import json, os

tmpdir = "$TMPDIR"

def load(name):
    with open(f"{tmpdir}/{name}.json") as f:
        return json.load(f)

tables_data = {}
for t in "$TABLES".split():
    tables_data[t] = load(t)

# Only seed company_users for users that exist in staging
# Get staging users via Management API
import subprocess
result = subprocess.run([
    'curl', '-s',
    'https://api.supabase.com/v1/projects/$STAGING_REF/database/query',
    '-H', 'Authorization: Bearer $SUPABASE_ACCESS_TOKEN',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': 'SELECT id FROM auth.users'})
], capture_output=True, text=True)
staging_users = set()
try:
    for row in json.loads(result.stdout):
        staging_users.add(row['id'])
except:
    staging_users = set()

print(f"  Staging has {len(staging_users)} auth users")

# Filter FK references to auth.users
tables_data['company_users'] = [r for r in tables_data['company_users'] if r['user_id'] in staging_users]
for c in tables_data['contacts']:
    if c.get('user_id') and c['user_id'] not in staging_users:
        c['user_id'] = None
for e in tables_data.get('email_log', []):
    if e.get('user_id') and e['user_id'] not in staging_users:
        e['user_id'] = None

SKIP_COLS = {'contacts': {'full_name'}}

def sql_val(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, (dict, list)):
        j = json.dumps(v, ensure_ascii=False)
        return "'" + j.replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

def insert_rows(table, rows, upsert_cols=None, conflict_override=None):
    skip = SKIP_COLS.get(table, set())
    lines = []
    for row in rows:
        cols = [c for c in row.keys() if c not in skip]
        col_names = ', '.join(cols)
        vals = ', '.join([sql_val(row[c]) for c in cols])
        if conflict_override:
            conflict = conflict_override
        elif upsert_cols:
            updates = ', '.join([f"{c} = EXCLUDED.{c}" for c in upsert_cols if c not in skip])
            conflict = f"ON CONFLICT (id) DO UPDATE SET {updates}"
        else:
            conflict = "ON CONFLICT (id) DO NOTHING"
        lines.append(f"INSERT INTO {table} ({col_names}) VALUES ({vals}) {conflict};")
    return lines

ordered_tables = [
    ('service_categories', None, None),
    ('services', None, None),
    ('companies', ['name', 'status', 'type'], None),
    ('contacts', ['first_name', 'last_name', 'email'], None),
    ('company_users', None, 'ON CONFLICT ON CONSTRAINT client_users_user_id_client_id_key DO NOTHING'),
    ('proposals', None, None),
    ('proposal_items', None, None),
    ('agreement_templates', None, None),
    ('agreements', None, None),
    ('projects', None, None),
    ('invoices', None, None),
    ('company_services', None, None),
    ('report_sets', None, None),
    ('reports', None, None),
    ('report_items', None, None),
    ('email_log', None, None),
]

sql = ["-- Seed staging from production data", "-- Auto-generated by seed-staging.sh\n"]

# Clean agreement_templates to avoid unique constraint issues
sql.append("DELETE FROM agreements WHERE template_id IS NOT NULL;")
sql.append("DELETE FROM agreement_templates;\n")

for table, upsert_cols, conflict in ordered_tables:
    rows = tables_data[table]
    sql.append(f"-- {table} ({len(rows)})")
    sql.extend(insert_rows(table, rows, upsert_cols=upsert_cols, conflict_override=conflict))
    sql.append("")

with open(f"{tmpdir}/seed.sql", 'w') as f:
    f.write('\n'.join(sql))

total = sum(len(tables_data[t]) for t, _, _ in ordered_tables)
print(f"  Generated: {total} rows across {len(ordered_tables)} tables")
PYEOF

if [ "$DRY_RUN" = true ]; then
  echo "→ SQL saved to: $TMPDIR/seed.sql"
  echo "  Review with: cat $TMPDIR/seed.sql | head -50"
  exit 0
fi

echo "→ Applying seed to staging..."
RESULT=$(curl -s -X POST "https://api.supabase.com/v1/projects/$STAGING_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json; print(json.dumps({'query': open('$TMPDIR/seed.sql').read()}))")")

if echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'message' not in d else 1)" 2>/dev/null; then
  echo "✓ Staging seeded successfully"
else
  echo "✗ Seed failed:"
  echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','Unknown error')[:500])"
  exit 1
fi

# Cleanup
rm -rf "$TMPDIR"
echo "✓ Done"
