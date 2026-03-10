import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'current_client_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Check if user is a super_admin (Brik platform operator)
 */
async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role === 'super_admin';
}

/**
 * Get the current client ID from cookie, with fallback logic.
 * Super admins can view any company. Regular users need company_users access.
 */
export async function getCurrentClientId(userId: string): Promise<string | null> {
  const cookieStore = cookies();
  const currentClientId = cookieStore.get(COOKIE_NAME)?.value;
  const admin = await isSuperAdmin(userId);

  // If cookie exists, verify access
  if (currentClientId) {
    const supabase = createClient();

    if (admin) {
      // Super admins: just verify company exists
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('id', currentClientId)
        .single();
      if (data) return currentClientId;
    } else {
      // Regular users: verify company_users membership
      const { data } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', userId)
        .eq('company_id', currentClientId)
        .single();
      if (data) return currentClientId;
    }
  }

  // No valid cookie — get user's first available client
  const clients = await getUserClients(userId);
  if (clients.length === 0) return null;

  return clients[0].id;
}

/**
 * Set the current client ID cookie
 */
export async function setCurrentClientId(clientId: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, clientId, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false, // Needs client-side access for switcher
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Clear the current client ID cookie
 */
export async function clearCurrentClientId(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get all clients the user has access to.
 * Super admins see all companies. Regular users see only their company_users memberships.
 */
export async function getUserClients(userId: string): Promise<Array<{ id: string; name: string }>> {
  const supabase = createClient();
  const admin = await isSuperAdmin(userId);

  if (admin) {
    // Super admins can view any company
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    return (data ?? []).map((c) => ({ id: c.id, name: c.name }));
  }

  // Regular users: only companies they belong to
  const { data } = await supabase
    .from('company_users')
    .select(`
      company_id,
      companies (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (!data) {
    return [];
  }

  return data.map((cu) => {
    const client = cu.companies as unknown as { id: string; name: string } | null;
    return {
      id: cu.company_id,
      name: client?.name || 'Unknown Client',
    };
  });
}
