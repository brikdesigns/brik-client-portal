import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for serverless functions.
 *
 * Uses a sliding window counter per IP. Works within a single
 * Netlify function instance — not distributed, but sufficient to
 * block rapid automated attacks against public endpoints.
 *
 * For production scale, swap to Upstash Redis rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for an identifier (typically IP address).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: config.limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ── Pre-configured limiters for common use cases ─────────────

/** Public token endpoints: 20 requests per minute per IP */
export const PUBLIC_TOKEN_LIMIT: RateLimitConfig = { limit: 20, windowSeconds: 60 };

/** Account setup: 5 attempts per 15 minutes per IP */
export const SETUP_LIMIT: RateLimitConfig = { limit: 5, windowSeconds: 900 };

/** AI generation endpoints: 10 requests per minute per IP */
export const AI_GENERATION_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 60 };

/** Admin email sending: 20 per minute per IP (prevent accidental spam) */
export const ADMIN_EMAIL_LIMIT: RateLimitConfig = { limit: 20, windowSeconds: 60 };

/** External API sync (Stripe, GHL): 5 per minute per IP */
export const EXTERNAL_SYNC_LIMIT: RateLimitConfig = { limit: 5, windowSeconds: 60 };

/**
 * Rate limit helper that returns a 429 NextResponse if exceeded, or null if OK.
 * Reduces boilerplate in route handlers.
 */
export function rateLimitOrNull(
  request: Request,
  prefix: string,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`${prefix}:${ip}`, config);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }
  return null;
}
