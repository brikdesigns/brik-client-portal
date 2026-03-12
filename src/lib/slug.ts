import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Convert a string to a URL-safe slug.
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique slug for a table by checking for existing matches.
 * If "acme-corp" exists, returns "acme-corp-2". If that exists, "acme-corp-3", etc.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: string,
  name: string,
): Promise<string> {
  const base = toSlug(name);
  if (!base) return base;

  // Fetch all slugs that start with the base slug
  const { data } = await supabase
    .from(table)
    .select('slug')
    .like('slug', `${base}%`);

  const existing = new Set((data ?? []).map((r: { slug: string }) => r.slug));

  if (!existing.has(base)) return base;

  // Find next available suffix
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) {
    suffix++;
  }
  return `${base}-${suffix}`;
}

/**
 * Check if a company with the exact name already exists.
 * Returns the matching company's name and slug if found.
 */
export async function checkDuplicateName(
  supabase: SupabaseClient,
  table: string,
  name: string,
): Promise<{ name: string; slug: string } | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data } = await supabase
    .from(table)
    .select('name, slug')
    .ilike('name', trimmed)
    .limit(1)
    .single();

  return data ?? null;
}
