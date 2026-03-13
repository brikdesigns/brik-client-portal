import { NextResponse } from 'next/server';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

type CheckStatus = 'ok' | 'degraded' | 'unreachable' | 'unconfigured';
interface CheckResult { status: CheckStatus; latency_ms: number }

async function checkEndpoint(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    return { status: res.ok ? 'ok' : 'degraded', latency_ms: Date.now() - start };
  } catch {
    return { status: 'unreachable', latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const start = Date.now();
  const checks: Record<string, CheckResult> = {};

  // Run all checks in parallel for speed
  const [supabase, anthropic, notion] = await Promise.all([
    // Supabase: hit the REST API root
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? checkEndpoint(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
          { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        )
      : Promise.resolve({ status: 'unconfigured' as CheckStatus, latency_ms: 0 }),

    // Anthropic: lightweight models list call (no tokens consumed)
    process.env.ANTHROPIC_API_KEY
      ? checkEndpoint(
          'https://api.anthropic.com/v1/models',
          {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
        )
      : Promise.resolve({ status: 'unconfigured' as CheckStatus, latency_ms: 0 }),

    // Notion: hit the users/me endpoint (lightweight, confirms token works)
    process.env.NOTION_TOKEN
      ? checkEndpoint(
          'https://api.notion.com/v1/users/me',
          {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
          },
        )
      : Promise.resolve({ status: 'unconfigured' as CheckStatus, latency_ms: 0 }),
  ]);

  checks.supabase = supabase;
  checks.anthropic = anthropic;
  checks.notion = notion;

  const statuses = Object.values(checks).map(c => c.status);
  const allOk = statuses.every(s => s === 'ok' || s === 'unconfigured');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: APP_VERSION,
      checks,
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
