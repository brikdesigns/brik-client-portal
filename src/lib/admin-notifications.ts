import { createClient } from '@supabase/supabase-js';

/**
 * Get all super_admin email addresses for notifications.
 * Falls back to ADMIN_EMAIL env var if DB query fails.
 */
export async function getAdminEmails(): Promise<string[]> {
  const fallback = process.env.ADMIN_EMAIL;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    const emails = (admins ?? [])
      .map((a) => a.email)
      .filter((e): e is string => !!e);

    if (emails.length > 0) return emails;
  } catch (err) {
    console.error('Failed to fetch admin emails from DB:', err);
  }

  // Fallback to env var
  if (fallback) return [fallback];

  console.error('No admin emails found — set ADMIN_EMAIL env var as fallback');
  return [];
}

/**
 * Get a single admin email (first super_admin, or env var fallback).
 * Use for single-recipient notifications.
 */
export async function getPrimaryAdminEmail(): Promise<string | null> {
  const emails = await getAdminEmails();
  return emails[0] ?? null;
}
