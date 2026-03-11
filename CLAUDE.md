# Brik Client Portal - Claude Code Instructions

## Project Context

Brik Designs client portal — secure web app where agency clients track projects, billing, and metrics. Admin-invite-only model (no public signup).

**Full Documentation:** [Notion - Build a Client Portal](https://www.notion.so/Build-a-Client-Portal-2f397d34ed2880a3bd72ecfbf459eaf3)

## Model Preference

**Always use Opus for this project.** This overrides the global Sonnet default.

## Session Startup

**Run these at the start of every work session:**

```bash
./scripts/health-check.sh --quick    # Verify environment is healthy
./scripts/agent-preflight.sh         # Check for active workstreams + conflicts
```

If multiple agents are active, claim your workstream before starting:

```bash
./scripts/agent-preflight.sh --claim "Your task" --files "src/app/(auth)/admin/area/*"
```

This catches stale secrets, broken connections, migration drift, and multi-agent conflicts before you waste time debugging.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + BDS CSS custom properties |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Supabase PostgreSQL (RLS) |
| Email | Resend (branded invite/notification emails) |
| Design System | brik-bds git submodule |
| Deployment | Netlify (Agent Runners enabled) |

## Environments

### Quick reference — where does my work go?

| Branch | Supabase | Netlify URL | Purpose |
|--------|----------|-------------|---------|
| `staging` | Staging project | Branch deploy (auto) | Day-to-day development, test migrations |
| `main` | Production project | `portal.brikdesigns.com` | Live client-facing app |

### Rules for agents (CRITICAL — read this)

1. **Staging is the default target.** All new migrations, features, and fixes go to `staging` first.
2. **Never push directly to `main`** without user confirmation. Merge via PR or explicit request.
3. **Migrations flow one way:** write → apply to staging (automatic on push) → test → merge to main → apply to prod (automatic on push).
4. **Don't wait to merge.** Staging exists so you can move fast and break things. Push early, push often to `staging`. Only `main` needs to be careful.
5. **If a migration fails on staging,** fix it and push again. Staging is disposable — it can be rebuilt from scratch by running all migrations.
6. **Production repairs list** (`APPLIED_MIGRATIONS` in the workflow) only applies to prod. Staging gets all migrations via CLI from the start, so no repair step is needed.

### Supabase projects

| Environment | Project Ref | URL | Admin User |
|-------------|-------------|-----|------------|
| **Production** | `rnspxmrkpoukccahggli` | `https://rnspxmrkpoukccahggli.supabase.co` | nick@brikdesigns.com |
| **Staging** | `lmhzpzobdkstzpvsqest` | `https://lmhzpzobdkstzpvsqest.supabase.co` | nick@brikdesigns.com |

- **Auth Model:** Admin-invite-only, role-based (admin/client)
- **RLS:** Admin bypass via `get_user_role()` SECURITY DEFINER function
- **Keys:** JWT format (`eyJ...`), stored in `.env.local`

### GitHub secrets required

| Secret | Required | Purpose | Status |
|--------|----------|---------|--------|
| `SUPABASE_ACCESS_TOKEN` | **YES** | Management API — the ONLY secret CI needs for migrations | Set |
| `SUPABASE_DB_PASSWORD` | No | CLI fallback only (local convenience) | Set |
| `SUPABASE_STAGING_PROJECT_REF` | No | CLI fallback only | Set |
| `SUPABASE_STAGING_DB_PASSWORD` | No | CLI fallback only | Set |

CI uses the Management API (`db-migrate-api.sh`) which only needs `SUPABASE_ACCESS_TOKEN`. DB passwords are only needed for the Supabase CLI path, which is a local convenience tool with automatic API fallback.

### Netlify env vars (branch-scoped)

Production env vars are already set. Staging needs branch-scoped overrides:

| Variable | Production (main) | Staging (staging branch) |
|----------|-------------------|--------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | prod URL | staging URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon key | staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod service key | staging service key |
| `NEXT_PUBLIC_SITE_URL` | `https://portal.brikdesigns.com` | Netlify branch deploy URL |

### Future environments

| Environment | When to add | Supabase project | Netlify |
|-------------|-------------|-----------------|---------|
| **Demo** | When colleague needs sales demos | New project, seeded with realistic fake data | `demo.brikdesigns.com` or branch deploy |
| **New product** | When building a separate tool (analytics, ops dashboard, etc.) | Completely separate project(s) per env | Separate Netlify site |

## Netlify

- **Project ID:** `902a0eb4-00bb-4cd7-b45b-f31f1358076b`
- **Site Name:** `brik-client-portal`
- **Live Domain:** `portal.brikdesigns.com`
- **DNS:** CNAME `portal` → `brik-client-portal.netlify.app` (SiteGround)
- **Features:** Agent Runners enabled, Next.js Runtime auto-detected
- **GitHub App:** Installed on `brikdesigns` org (required for auto-deploy)
- **Env Vars:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
- **Both repos public:** brik-client-portal + brik-bds (required for submodule build)
- **Build credits:** Pro plan = 3,000/month. Each push to main/staging/PR = ~2 min of credits.
- **Best practices:** [Product Build Workflow](https://www.notion.so/Product-Build-Workflow-31097d34ed2880eebdb6eb335581276f)

### Deploy rules (MANDATORY)

1. **Always `npm run build` locally before pushing.** The pre-push hook enforces this.
2. **Batch changes** — commit locally as much as you want, push 2-3x/day max during active dev.
3. **Use `[skip ci]` in commit messages** for docs-only changes (README, comments, CLAUDE.md).
4. **Never push to main without confirming with the user.**
5. **Check for lint errors** before pushing (`npm run lint`).

## Architecture

```
Browser → Next.js (Netlify) → Supabase Auth + PostgreSQL
                             → Resend (transactional email)
                             → Notion (content sync, future)
                             → Stripe (invoice sync, future)
                             → Webflow (site integration, future)
```

## Design System (brik-bds)

Git submodule at `./brik-bds/`. Uses **Brik Designs company brand** — NOT any of the 8 BDS web template themes.

### BDS Workflow (CRITICAL)

**NEVER edit files inside `brik-client-portal/brik-bds/`.** That directory is a read-only submodule. All BDS development happens in the standalone repo at `~/Documents/GitHub/brik/brik-bds/`.

**Workflow:**
1. Make BDS changes in `~/Documents/GitHub/brik/brik-bds/` → commit → push
2. Pull into portal: `./scripts/bds-sync.sh` (fetches latest, builds, commits submodule ref)
3. Push portal when ready

**Available commands:**
| Command | What it does |
|---------|-------------|
| `./scripts/bds-sync.sh` | Pull latest BDS + build + commit |
| `./scripts/bds-sync.sh --dry-run` | Pull + build, no commit |
| `./scripts/bds-sync.sh --check` | Show current vs latest (read-only) |

### Brand vs Templates (critical distinction)

| | Brik Designs Brand | BDS Web Templates |
| --- | --- | --- |
| Purpose | Company identity (portal, brikdesigns.com) | Product offering (web store) |
| CSS class | None — brand tokens on `.body` selector | `.body.theme-1` through `.body.theme-8` |
| Colors | Poppy red, near-black, tan/cream | Varies per theme |
| Font | Poppins (all roles) | Varies (Open Sans, Geist, Playfair, etc.) |
| Figma source | `figma-variables.json` → `theme.brik` | `figma-variables.json` → theme palettes |

**Architecture:** ThemeProvider has `applyToBody={false}` so no `theme-X` class is added to `<body>`. The portal's `<body>` only has the `body` class. Brand tokens are defined in `globals.css` on the `.body` selector, which beats BDS `.body` defaults by source order. BDS theme-specific CSS rules (like `@media 1440px .body.theme-1` spacious spacing) never match.

### Brand Tokens (defined in globals.css)

- Primary: `#E35335` (poppy red)
- Secondary: `#1B1B1B` (near-black)
- Accent: `#F1F0EC` (tan/cream)
- Font: Poppins (all roles)
- Dark mode: Not yet implemented (brikdesigns.com is light-only currently)

### Token Naming Convention
```
--_[category]---[type]--[variant]
```

### Token consumption (MANDATORY)

This project follows the BDS token consumption standard. See `brik-bds/CONSUMING-TOKENS.md` for the full guide.

**Never write raw CSS `var()` strings inline.** Always import from the shared system:

```tsx
import { font, color, space, gap, border } from '@/lib/tokens';  // Individual values
import { text, heading, label, meta, detail } from '@/lib/styles';  // Composed presets
import { Prose } from '@/components/prose';                        // Markdown rendering
```

**Key files:**

- `src/lib/tokens.ts` — Figma style name to CSS var() mapping
- `src/lib/styles.ts` — Composed CSSProperties presets (includes `detail` for read-only pages)
- `src/components/prose.tsx` — Shared ReactMarkdown renderer
- `.husky/pre-commit` — Blocks hardcoded px font sizes and numeric line heights

**Pre-commit enforcement:** The husky hook checks staged `.ts`/`.tsx` files for `fontSize: '[0-9]` and `lineHeight: [0-9]` patterns and blocks the commit if found.

### Read-only vs Edit-mode convention (CRITICAL)

Data in this portal has two presentation modes that share the same data points but render differently. Inspired by [Carbon's read-only states pattern](https://carbondesignsystem.com/patterns/read-only-states-pattern/).

| | Read mode (detail/view pages) | Edit mode (form pages) |
|---|---|---|
| **Labels** | `detail.label` — label/md, text-muted | BDS TextInput/Select built-in label |
| **Values** | `detail.value` — body/md, text-primary | BDS form component (interactive input) |
| **Layout** | `detail.grid` — 3-col grid, left-aligned | Single-column form, maxWidth 600px |
| **Links** | `detail.link` — body/md, system-link color | N/A (edit mode uses inputs) |
| **Empty** | `detail.empty` — text-muted dash (—) | Empty input placeholder |
| **Sections** | `detail.sectionLabel` — label/md, muted, top padding | `heading.section` for form groups |

**Always use `detail.*` presets on view pages.** Never define local `fieldLabelStyle` / `fieldValueStyle` variables — import from `@/lib/styles` instead.

```tsx
import { detail } from '@/lib/styles';

// Read-only field pair
<p style={detail.label}>Status</p>
<p style={detail.value}><ProjectStatusBadge status={project.status} /></p>

// 3-column grid
<div style={detail.grid}>
  <div>
    <p style={detail.label}>Field</p>
    <p style={detail.value}>Value</p>
  </div>
</div>

// Empty values
<span style={detail.empty}>—</span>

// Links inside values
<a style={detail.link} href="...">Open in Notion ↗</a>

// Section dividers
<p style={detail.sectionLabel}>ClickUp</p>
```

**Reference implementation:** `src/app/(auth)/admin/projects/[slug]/page.tsx`

### BDS Components Used
| Component | Import Path | Usage |
|-----------|------------|-------|
| Button | `@bds/components/ui/Button/Button` | Forms, actions |
| Input | `@bds/components/ui/Input/Input` | Form fields |
| Card | `@bds/components/ui/Card/Card` | Content containers |
| Badge | `@bds/components/ui/Badge/Badge` | Status indicators |
| Link | `@bds/components/ui/Link/Link` | Navigation |
| ThemeProvider | `@bds/components/providers/ThemeProvider` | Theme wrapper |
| Table | `@bds/components/ui/Table/Table` | Data tables (requires 'use client') |
| Counter | `@bds/components/ui/Counter/Counter` | Numeric badges |
| SidebarNavigation | `@bds/components/ui/SidebarNavigation/SidebarNavigation` | Admin sidebar |

### Component Integration Checklist

**Before integrating a BDS component into the portal, follow this checklist:**

1. **Read Storybook Documentation**
   - [ ] Open component's `.mdx` file in brik-bds
   - [ ] Review "Framework Compatibility" section
   - [ ] Check for Next.js-specific notes

2. **Verify TypeScript Exports**
   - [ ] Check component's `index.ts` exports match actual exports
   - [ ] Verify type definitions are exported with `export type`

3. **Check Client/Server Requirements**
   - [ ] Does component use React Context, hooks, or browser APIs?
   - [ ] If yes, ensure component has `'use client'` directive at top of file
   - [ ] If not, component can be used in server components

4. **Test Build Locally**

   ```bash
   npm run build
   ```

   - [ ] Build completes without TypeScript errors
   - [ ] No "isolatedModules" errors
   - [ ] No missing export errors

5. **Integration Pattern**
   - [ ] For navigation components: wrap with Next.js `Link` and `usePathname`
   - [ ] For form components: integrate with form library state
   - [ ] For data components: test with actual Supabase queries

6. **Common Issues to Check**

   | Issue | Check | Fix |
   |-------|-------|-----|
   | Build fails with Context error | Component needs 'use client' | Add to component file |
   | Export not found | index.ts out of sync | Update barrel export |
   | Type error in portal | Using wrong prop types | Check .mdx docs for correct API |
   | Navigation doesn't work | Using href instead of Link | Wrap in Next.js Link |

### Component Integration Feedback Loop

**When you find an issue integrating a BDS component:**

1. ✅ **Fix it in the portal** (immediate unblock)
2. ✅ **Document the issue** (what broke, why it broke)
3. ✅ **Fix it in BDS** (prevent next project from hitting it)
4. ✅ **Update Storybook docs** (add to .mdx compatibility notes)
5. ✅ **Commit and push BDS changes**
6. ✅ **Update portal submodule reference**

This creates a virtuous cycle: Portal → Discovers Issue → Improves BDS → Better for Next Project

## Project Structure

```
src/
├── app/
│   ├── globals.css              # BDS imports + brand overrides
│   ├── layout.tsx               # Root layout (Poppins, BDSProvider)
│   ├── page.tsx                 # Redirect → /login
│   ├── not-found.tsx            # Custom 404
│   ├── login/page.tsx           # Login page
│   ├── forgot-password/page.tsx # Password reset request
│   ├── reset-password/page.tsx  # Set new password
│   ├── auth/callback/route.ts   # Supabase auth code exchange
│   ├── api/
│   │   ├── admin/invite/route.ts    # Create user + send email
│   │   └── webhooks/resend/route.ts # Email delivery tracking
│   └── (auth)/                  # Protected route group
│       ├── layout.tsx           # Auth check → redirect if no session
│       ├── admin/               # Admin portal (role=admin only)
│       │   ├── layout.tsx       # Role check + sidebar
│       │   ├── page.tsx         # Overview (stats, recent projects)
│       │   ├── loading.tsx      # Skeleton loader
│       │   ├── clients/         # Client management
│       │   │   ├── page.tsx     # Client list
│       │   │   ├── new/page.tsx # Add client form
│       │   │   └── [id]/        # Client detail
│       │   │       ├── page.tsx          # Detail view (+ services section)
│       │   │       ├── edit/page.tsx     # Edit form
│       │   │       ├── projects/new/     # Add project
│       │   │       ├── invoices/new/     # Add invoice
│       │   │       └── services/new/     # Assign service
│       │   ├── services/        # Service catalog management
│       │   │   ├── page.tsx     # Service list (grouped by category)
│       │   │   ├── new/page.tsx # Add service form
│       │   │   └── [id]/        # Service detail
│       │   │       ├── page.tsx          # Detail + client assignments
│       │   │       └── edit/page.tsx     # Edit form
│       │   └── users/page.tsx   # User management + invite
│       └── dashboard/           # Client dashboard (role=client)
│           ├── layout.tsx       # Top nav
│           ├── page.tsx         # Overview (services + stats, 2-col)
│           ├── loading.tsx      # Skeleton loader
│           ├── services/page.tsx # Client services list
│           ├── payments/page.tsx # Invoice list (renamed from billing)
│           ├── projects/page.tsx # Project list (legacy)
│           └── billing/page.tsx  # Invoice list (legacy)
├── components/
│   ├── bds-provider.tsx         # ThemeProvider wrapper
│   ├── page-header.tsx          # Shared page header (title, subtitle, action)
│   ├── status-badges.tsx        # Project/Client/Invoice/Service status badges
│   ├── service-badge.tsx        # Category color badge + label
│   ├── service-card.tsx         # Dashboard service card (badge + name + desc)
│   ├── stat-card.tsx            # Metric card (label + value)
│   ├── data-table.tsx           # Generic table with column definitions
│   ├── empty-state.tsx          # Consistent empty state messaging
│   ├── admin-sidebar.tsx        # Admin navigation sidebar
│   ├── client-nav.tsx           # Client top navigation
│   ├── sign-out-button.tsx      # Shared sign-out
│   ├── login-form.tsx           # Login with role-based redirect
│   ├── forgot-password-form.tsx # Password reset request
│   ├── reset-password-form.tsx  # New password form
│   ├── invite-user-form.tsx     # Admin invite form
│   ├── edit-client-form.tsx     # Client edit form
│   ├── edit-service-form.tsx    # Service edit form
│   └── theme-toggle.tsx         # Dark/light mode toggle
├── lib/
│   ├── fonts.ts                 # Poppins via next/font/google
│   ├── format.ts                # formatCurrency utility
│   ├── email.ts                 # Resend integration
│   └── supabase/
│       ├── client.ts            # Browser client
│       └── server.ts            # Server client with cookies
└── middleware.ts                # Auth session refresh + redirects
```

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run lint       # Run linter
npm run db:push    # Apply pending migrations to live Supabase
npm run db:diff    # Generate migration from schema diff
npm run db:status  # List migration status (applied/pending)
npm run db:seed    # Reset local DB with seeds (destructive!)
```

### Infrastructure scripts

```bash
./scripts/health-check.sh            # Full infra health check
./scripts/health-check.sh --quick    # Fast check (skip build + Netlify)
./scripts/health-check.sh --ci       # CI mode (exit code = failure count)
./scripts/db-migrate.sh              # Apply migrations to staging (CLI + API fallback)
./scripts/db-migrate.sh --prod       # Apply migrations to production
./scripts/db-migrate.sh --api        # Skip CLI, use Management API directly
./scripts/db-migrate-api.sh          # Management API runner (CI uses this)
./scripts/db-migrate-api.sh --status # Show applied vs pending (no DB password needed)
./scripts/bds-sync.sh               # Pull latest BDS submodule
```

## Migration Workflow

### Architecture: Management API-first

CI uses the Supabase Management API (`db-migrate-api.sh`) which needs only `SUPABASE_ACCESS_TOKEN`. This eliminates DB password drift — the #1 cause of pipeline failures. The Supabase CLI is kept for local convenience with automatic API fallback.

```
                AGENTS (feature branches)
                ┌──────────┐  ┌──────────┐
                │ Agent A  │  │ Agent B  │
                └────┬─────┘  └────┬─────┘
                     │             │
                ┌────▼─────────────▼────┐
                │   pre-push hook       │
                │   • build check       │
                │   • migration number  │
                │     conflict check    │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │      staging          │
                └───────────┬───────────┘
              concurrency: migrate-staging
              (queues, never cancels)
                            │
                ┌───────────▼───────────┐
                │  GitHub Actions       │
                │  db-migrate-api.sh    │
                │  (Management API)     │
                │  needs: ACCESS_TOKEN  │
                │  only                 │
                │                       │
                │  on failure:          │
                │  → GitHub Issue       │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │     main (PR merge)   │
                │  same pipeline,       │
                │  target=production    │
                └───────────────────────┘
```

### How migrations flow

```
Write SQL → push to staging → CI applies via Management API → test → merge to main → CI applies to prod
```

### Creating migrations

1. Write SQL in `supabase/migrations/NNNNN_description.sql` (increment the number)
2. Commit and push to `staging` — CI auto-applies to staging Supabase
3. Test on staging branch deploy
4. Merge `staging` → `main` — CI auto-applies to production Supabase

### Multi-agent safety

The pre-push hook detects migration number conflicts across branches. If two agents create the same migration number on different branches, the push is blocked with a suggested next number.

### Applying migrations locally

```bash
./scripts/db-migrate.sh                    # Staging (CLI first, API fallback)
./scripts/db-migrate.sh --prod             # Production (requires confirmation)
./scripts/db-migrate.sh --api              # Skip CLI, use API directly
./scripts/db-migrate.sh --status           # Status only
./scripts/db-migrate.sh --dry-run          # Preview what would be applied
./scripts/db-migrate-api.sh --status       # Status via API (no DB password needed)
```

### Manual Dashboard migrations

If you apply SQL via Supabase Dashboard, record it in schema_migrations:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('NNNNN', 'description') ON CONFLICT DO NOTHING;
```

Use `./scripts/db-migrate-api.sh --status` to verify the record was created.

### GitHub Action (`.github/workflows/migrate.yml`)

- Uses `db-migrate-api.sh` (Management API) — no DB password needed
- Only requires `SUPABASE_ACCESS_TOKEN` GitHub secret
- Triggers on push to `main` or `staging` when `supabase/migrations/**` changes
- Auto-detects environment from branch (`main` → prod, `staging` → staging)
- Concurrency group per branch — queues (never cancels) simultaneous pushes
- On failure: auto-creates a GitHub issue for visibility
- Supports manual dispatch with environment override and dry-run option

## Multi-Agent Coordination

Multiple Claude Code agents can work on this portal simultaneously. Follow these rules to avoid collisions.

### Before starting work (MANDATORY)

```bash
./scripts/agent-preflight.sh                                              # Check status
./scripts/agent-preflight.sh --claim "Add invoice PDF" --files "src/app/(auth)/admin/invoices/*"  # Claim your area
```

### The coordination protocol

1. **Run preflight** — see who's working on what, check for conflicts
2. **Claim your workstream** — declare what you're building and which files you own
3. **Use a feature branch** for anything non-trivial: `feat/description`, `fix/description`
4. **Never touch another agent's claimed files** without coordinating first
5. **Release your claim** when done: `./scripts/agent-preflight.sh --release`

### File ownership zones (natural boundaries)

| Zone | Path | Safe for parallel work? |
|------|------|------------------------|
| Companies CRUD | `src/app/(auth)/admin/companies/` | Yes (isolated route) |
| Projects CRUD | `src/app/(auth)/admin/projects/` | Yes (isolated route) |
| Invoices/Billing | `src/app/(auth)/admin/invoices/` | Yes (isolated route) |
| Reporting | `src/app/(auth)/admin/reporting/` | Yes (isolated route) |
| Services | `src/app/(auth)/admin/services/` | Yes (isolated route) |
| Client dashboard | `src/app/(auth)/dashboard/` | Yes (isolated route) |
| Shared components | `src/components/` | **ONE AGENT AT A TIME** |
| Shared lib | `src/lib/` | **ONE AGENT AT A TIME** |
| Migrations | `supabase/migrations/` | **CLAIM YOUR NUMBER FIRST** |
| Styles/tokens | `src/lib/tokens.ts`, `src/lib/styles.ts` | **ONE AGENT AT A TIME** |
| BDS submodule | `brik-bds/` | **NEVER EDIT** (read-only) |

### Migration coordination

The most dangerous multi-agent scenario. Before creating a migration:

1. Check the latest number: `ls supabase/migrations/ | tail -1`
2. Create the file immediately (even if empty) to claim the number
3. Commit before the other agent creates theirs
4. The pre-push hook blocks migration number collisions as a safety net

### Shared file protocol

For files in the "ONE AGENT AT A TIME" zones:

1. Check if another agent has claimed the file: `./scripts/agent-preflight.sh --list`
2. If claimed, either wait or coordinate to take turns
3. If unclaimed, claim it: `--claim "Update tokens" --files "src/lib/tokens.ts"`
4. Make your changes, commit, and release the claim

### Branch strategy for parallel agents

```
Agent A: feat/invoice-pdf-export     → merges to staging
Agent B: feat/property-hierarchy     → merges to staging
Agent C: (small fix)                 → commits directly to staging
```

Feature branches give maximum isolation. Use them when:
- Two agents need to touch overlapping files
- Work will span multiple sessions
- You want a PR review before merging

### What NOT to do

- Don't have two agents edit `globals.css`, `tokens.ts`, or `styles.ts` at the same time
- Don't have two agents running `./scripts/bds-sync.sh` simultaneously
- Don't push to the same branch within 3 minutes of each other (let Netlify build finish)
- Don't create a migration while another agent is modifying the same table
- Don't skip the preflight check

## Key Integrations

| Service | Integration Method | Status |
|---------|-------------------|--------|
| Supabase | Auth + PostgreSQL + RLS | Live |
| Netlify | Auto-deploy from main | Live |
| Resend | Transactional email API | Configured (needs API key) |
| Notion | MCP Server / Direct API | Planned (content sync) |
| Webflow | MCP Server / Direct API | Planned (site integration) |
| Stripe | Webhook + API | Planned (invoice sync) |
| ClickUp | Brain + Claude / Webhooks | Planned |

## Reusable Framework Pattern

This portal is designed as a **template for future client portals**. Key reusable patterns:

| Pattern | Files | What It Does |
|---------|-------|-------------|
| Auth flow | `middleware.ts`, `(auth)/layout.tsx`, `login-form.tsx` | Admin-invite-only, role-based routing |
| Admin CRUD | `admin/clients/`, `admin/services/`, `admin/users/` | Full client/service/user management |
| Client dashboard | `dashboard/` | Services-centric overview + payments |
| Shared components | `page-header`, `data-table`, `status-badges`, `stat-card`, `service-badge`, `service-card` | Consistent UI with minimal code |
| Supabase RLS | `migrations/00001_initial_schema.sql`, `00002_services.sql` | Admin bypass + client data isolation |
| Brand theming | `globals.css`, `bds-provider.tsx` | BDS design system with brand overrides |

**To spin up for a new client:** Fork repo → update brand tokens in `globals.css` → create new Supabase project → set env vars → deploy.

## Deployment Checklist (for new instances)

1. Create Supabase project, run migration SQL
2. Set Supabase Auth redirect URLs for target domain
3. Create Netlify site, link to GitHub repo
4. Install Netlify GitHub App on org (`github.com/apps/netlify/installations/new`)
5. Set env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
6. Configure DNS (CNAME to netlify app)
7. Create admin user in Supabase Auth, set profile role to 'admin'

## Related Repos

- `brik-llm` — Automation scripts, MCP configurations
- `brik-bds` — Design system components (submodule, public)
- `brikdesigns` — Company website (brand source CSS)

## MCP Servers Available

Reference `~/.claude.json` for configured MCP servers:
- Notion (workspace data)
- Webflow (site management)
- ClickUp (task management)
- Google Drive (file access)
