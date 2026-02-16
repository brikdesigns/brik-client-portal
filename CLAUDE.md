# Brik Client Portal - Claude Code Instructions

## Project Context

Brik Designs client portal — secure web app where agency clients track projects, billing, and metrics. Admin-invite-only model (no public signup).

**Full Documentation:** [Notion - Build a Client Portal](https://www.notion.so/Build-a-Client-Portal-2f397d34ed2880a3bd72ecfbf459eaf3)

## Model Preference

**Always use Opus for this project.** This overrides the global Sonnet default.

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

## Supabase

- **Project Ref:** `rnspxmrkpoukccahggli`
- **URL:** `https://rnspxmrkpoukccahggli.supabase.co`
- **Admin User:** nick@brikdesigns.com
- **Schema:** 8 tables — profiles, clients, projects, invoices, email_log, service_categories, services, client_services
- **Auth Model:** Admin-invite-only, role-based (admin/client)
- **RLS:** Admin bypass via `(select role from profiles where id = auth.uid()) = 'admin'`
- **Keys:** JWT format (`eyJ...`), stored in `.env.local`

## Netlify

- **Project ID:** `902a0eb4-00bb-4cd7-b45b-f31f1358076b`
- **Site Name:** `brik-client-portal`
- **Live Domain:** `portal.brikdesigns.com`
- **DNS:** CNAME `portal` → `brik-client-portal.netlify.app` (SiteGround)
- **Features:** Agent Runners enabled, Next.js Runtime auto-detected
- **GitHub App:** Installed on `brikdesigns` org (required for auto-deploy)
- **Env Vars:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
- **Both repos public:** brik-client-portal + brik-bds (required for submodule build)

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

## Migration Workflow

Supabase CLI manages database schema via SQL migration files in `supabase/migrations/`.

**Local development:**

1. Make schema changes → write SQL in `supabase/migrations/00003_*.sql`
2. `npm run db:push` to apply to live Supabase (requires `supabase link` first)
3. Commit and push — GitHub Action auto-applies on merge to main

**GitHub Action (`.github/workflows/migrate.yml`):**

- Triggers on push to `main` when `supabase/migrations/**` changes
- Runs `supabase db push` against live project
- Requires GitHub secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`

**First-time setup:**

1. `supabase login` (opens browser for Supabase dashboard OAuth)
2. `supabase link --project-ref rnspxmrkpoukccahggli`
3. Add secrets to GitHub: Settings → Secrets → Actions

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
