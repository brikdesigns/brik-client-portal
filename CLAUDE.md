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

## Development Guidelines

1. **Check Notion doc first** for architecture decisions
2. **Use Netlify Agent Runners** for Claude integration (no custom backend needed for MVP)
3. **Follow brik-bds** design tokens when building UI
4. **Test locally** before deploying via Netlify

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
