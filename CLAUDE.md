# Brik Client Portal - Claude Code Instructions

## Project Context

This is the Brik Designs internal client portal - a web application that automates Claude Code workflows.

**Full Documentation:** [Notion - Build a Client Portal](https://www.notion.so/Build-a-Client-Portal-2f397d34ed2880a3bd72ecfbf459eaf3)

## Architecture

```
User → ClickUp Brain (Claude) → Netlify Agent Runner → MCP (Notion/Webflow) → Deploy
```

## Netlify Project

- **Project ID:** `902a0eb4-00bb-4cd7-b45b-f31f1358076b`
- **Site Name:** `brik-client-portal`
- **Features:** Agent Runners enabled

## Key Integrations

| Service | Integration Method |
|---------|-------------------|
| Notion | MCP Server |
| Webflow | MCP Server / Direct API |
| ClickUp | Brain + Claude / Webhooks |
| Claude | Netlify Agent Runners |

## Design System (brik-bds)

The design system is included as a git submodule at `./brik-bds/`. Always use these standards.

### Token Naming Convention
```
--_[category]---[type]--[variant]
```

Examples:
- `--_space---section--lg` (spacing)
- `--_color---brand--primary` (color)
- `--_radius---component--md` (border radius)

### Core Tokens (Reference: `brik-bds/tokens/TOKEN-REFERENCE.md`)

**Spacing:**
- Section padding: `--_space---section--lg` (6rem default)
- Component padding: `--_space---component--md` (2rem default)
- Layout gap: `--_space---layout--md` (2rem default)

**Colors:**
- Primary: `--_color---brand--primary`
- Accent: `--_color---brand--accent`
- Surface: `--_color---surface--card`

**Typography:**
- Display font: `--_font---family--display` (Instrument Serif)
- Body font: `--_font---family--body` (Sora)

### Component Patterns

When building UI components:
1. Check if component exists in `brik-bds/components/`
2. Use existing component or follow its patterns
3. Apply design tokens, not hardcoded values
4. Follow BEM-style naming for custom classes

### HTML/CSS Class Conventions

| Content Type | Class Pattern |
|-------------|---------------|
| Sections | `.section.section--[type]` |
| Layouts | `.layout.layout--[cols]` |
| Display | `.display.display--[type]` |
| Elements | `.el.el--[type]` |

## Development Guidelines

1. **Check Notion doc first** for architecture decisions
2. **Use Netlify Agent Runners** for Claude integration (no custom backend needed for MVP)
3. **Follow brik-bds** design tokens when building UI (see above)
4. **Test locally** before deploying via Netlify
5. **Reference `/references/`** folder for detailed documentation

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linter
```

## Related Repos

- `brik-llm` - Automation scripts, MCP configurations
- `brik-bds` - Design system components

## MCP Servers Available

Reference `~/.claude.json` for configured MCP servers:
- Notion (workspace data)
- Webflow (site management)
- ClickUp (task management)
- Google Drive (file access)
