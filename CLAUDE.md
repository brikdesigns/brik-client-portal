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
- **Schema:** 5 tables — profiles, clients, projects, invoices, email_log
- **Auth Model:** Admin-invite-only, role-based (admin/client)
- **RLS:** Admin bypass via `(select role from profiles where id = auth.uid()) = 'admin'`
- **Keys:** JWT format (`eyJ...`), stored in `.env.local`

## Netlify

- **Project ID:** `902a0eb4-00bb-4cd7-b45b-f31f1358076b`
- **Site Name:** `brik-client-portal`
- **Target Domain:** `portal.brikdesigns.com` (planned)
- **Features:** Agent Runners enabled

## Architecture

```
Browser → Next.js (Netlify) → Supabase Auth + PostgreSQL
                             → Resend (transactional email)
                             → Notion (content sync, future)
                             → Stripe (invoice sync, future)
                             → Webflow (site integration, future)
```

## Design System (brik-bds)

Git submodule at `./brik-bds/`. Uses Brik Designs company brand (NOT any template theme).

### Brand Tokens (overridden in globals.css)
- Primary: `#E35335` (poppy red)
- Secondary: `#1B1B1B` (near-black)
- Accent: `#F1F0EC` (tan/cream)
- Font: Poppins (all roles)

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
│       │   │       ├── page.tsx          # Detail view
│       │   │       ├── edit/page.tsx     # Edit form
│       │   │       ├── projects/new/     # Add project
│       │   │       └── invoices/new/     # Add invoice
│       │   └── users/page.tsx   # User management + invite
│       └── dashboard/           # Client dashboard (role=client)
│           ├── layout.tsx       # Top nav
│           ├── page.tsx         # Overview (projects, invoices)
│           ├── loading.tsx      # Skeleton loader
│           ├── projects/page.tsx # Project list
│           └── billing/page.tsx  # Invoice list
├── components/
│   ├── bds-provider.tsx         # ThemeProvider wrapper
│   ├── admin-sidebar.tsx        # Admin navigation sidebar
│   ├── client-nav.tsx           # Client top navigation
│   ├── sign-out-button.tsx      # Shared sign-out
│   ├── login-form.tsx           # Login with role-based redirect
│   ├── forgot-password-form.tsx # Password reset request
│   ├── reset-password-form.tsx  # New password form
│   ├── invite-user-form.tsx     # Admin invite form
│   └── edit-client-form.tsx     # Client edit form
├── lib/
│   ├── fonts.ts                 # Poppins via next/font/google
│   ├── email.ts                 # Resend integration
│   └── supabase/
│       ├── client.ts            # Browser client
│       └── server.ts            # Server client with cookies
└── middleware.ts                # Auth session refresh + redirects
```

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run linter
```

## Key Integrations

| Service | Integration Method | Status |
|---------|-------------------|--------|
| Supabase | Auth + PostgreSQL + RLS | Live |
| Resend | Transactional email API | Configured (needs API key) |
| Notion | MCP Server / Direct API | Planned (content sync) |
| Webflow | MCP Server / Direct API | Planned (site integration) |
| Stripe | Webhook + API | Planned (invoice sync) |
| ClickUp | Brain + Claude / Webhooks | Planned |

## Related Repos

- `brik-llm` — Automation scripts, MCP configurations
- `brik-bds` — Design system components (submodule)
- `brikdesigns` — Company website (brand source CSS)

## MCP Servers Available

Reference `~/.claude.json` for configured MCP servers:
- Notion (workspace data)
- Webflow (site management)
- ClickUp (task management)
- Google Drive (file access)
