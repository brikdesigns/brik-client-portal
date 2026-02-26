import { NextResponse } from 'next/server';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, 'ok' | 'degraded' | 'unreachable'> = {};

  // Supabase connectivity
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    checks.supabase = res.ok ? 'ok' : 'degraded';
  } catch {
    checks.supabase = 'unreachable';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

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
