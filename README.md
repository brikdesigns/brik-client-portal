# Brik Client Portal

Internal back-office portal for Brik Designs that automates Claude Code workflows with a button-driven interface.

## Overview

This portal replaces manual VS Code + Claude Code workflows with:
- Task triggering via web UI or ClickUp
- Status tracking and output previews
- Prompt management and versioning
- Integration with Notion and Webflow via MCP

## Tech Stack

| Component | Tool |
|-----------|------|
| Frontend | Next.js 14 |
| Hosting | Netlify |
| AI | Claude (via Netlify Agent Runners) |
| Auth | TBD (Clerk recommended) |
| Database | TBD (Supabase recommended) |

## Netlify Project

- **Project ID:** `902a0eb4-00bb-4cd7-b45b-f31f1358076b`
- **Site Name:** `brik-client-portal`

## Documentation

Full technical assessment and architecture: [Notion - Build a Client Portal](https://www.notion.so/Build-a-Client-Portal-2f397d34ed2880a3bd72ecfbf459eaf3)

## Getting Started

```bash
npm install
npm run dev
```

## Related Projects

- [brik-llm](https://github.com/brikdesigns/brik-llm) - Automation scripts and workflows
- [brik-bds](https://github.com/brikdesigns/brik-bds) - Brik Design System
