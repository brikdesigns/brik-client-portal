/**
 * Centralized environment variable validation.
 *
 * Call `validateEnv()` once during server startup (root layout)
 * to fail fast if critical variables are missing.
 *
 * Optional variables (API keys for specific features) are validated
 * lazily at point of use — their absence degrades features gracefully
 * rather than blocking startup.
 */

const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const RECOMMENDED_SERVER_VARS = [
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  // Critical — app cannot function without these
  const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\n` +
      'Check .env.local or Netlify env var configuration.'
    );
  }

  // Recommended — warn but don't crash
  const warnings = RECOMMENDED_SERVER_VARS.filter((key) => !process.env[key]);
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(
      `[env] Missing recommended variables (some features may not work):\n  ${warnings.join('\n  ')}`
    );
  }
}
