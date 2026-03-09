import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * System-level roles (profiles.role)
 * super_admin = Brik employees (platform operators)
 * client = everyone else (company members)
 */
export type SystemRole = 'super_admin' | 'client';

/**
 * Company-level roles (company_users.role)
 * owner > admin > member > viewer
 */
export type CompanyRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Permission strings checked by has_company_permission() in the database.
 * Defined here for type safety in application code.
 */
export type Permission =
  | 'company.manage'
  | 'company.settings'
  | 'users.manage'
  | 'users.view'
  | 'properties.manage'
  | 'projects.view'
  | 'projects.manage'
  | 'invoices.view'
  | 'invoices.manage'
  | 'proposals.view'
  | 'proposals.accept'
  | 'reports.view'
  | 'services.view'
  | 'agreements.view'
  | 'agreements.sign';

export interface AuthUser {
  user: User;
  profile: {
    id: string;
    role: SystemRole;
    full_name: string | null;
    email: string | null;
  };
}

/**
 * Get the authenticated user and their profile.
 * Returns null if not authenticated or profile not found.
 */
export async function getAuthUser(supabase?: SupabaseClient): Promise<AuthUser | null> {
  const client = supabase ?? createClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    user,
    profile: profile as AuthUser['profile'],
  };
}

/**
 * Require authentication. Returns AuthUser or a 401 response.
 * Use in API routes:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(supabase?: SupabaseClient): Promise<AuthUser | NextResponse> {
  const authUser = await getAuthUser(supabase);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return authUser;
}

/**
 * Require Brik platform admin (super_admin). Returns AuthUser or a 401/403 response.
 * Use in API routes:
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(supabase?: SupabaseClient): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(supabase);
  if (result instanceof NextResponse) return result;

  if (result.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Check if an AuthUser is a Brik admin (super_admin).
 * Use in server components and layouts.
 */
export function isBrikAdmin(authUser: AuthUser): boolean {
  return authUser.profile.role === 'super_admin';
}

/**
 * Check if an AuthUser has a specific system role.
 */
export function hasSystemRole(authUser: AuthUser, ...roles: SystemRole[]): boolean {
  return roles.includes(authUser.profile.role);
}

/**
 * Type guard: check if a requireAuth/requireAdmin result is an error response.
 */
export function isAuthError(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
