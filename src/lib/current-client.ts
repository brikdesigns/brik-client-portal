import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'current_client_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BRIK_DESIGNS_ID = 'b0000000-0000-0000-0000-000000000001';

/**
 * Get the current client ID from cookie, with fallback logic
 * Falls back to: first available client, or Brik Designs for admins
 */
export async function getCurrentClientId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const currentClientId = cookieStore.get(COOKIE_NAME)?.value;

  // If cookie exists, verify user has access to that client
  if (currentClientId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', userId)
      .eq('client_id', currentClientId)
      .single();

    if (data) {
      return currentClientId;
    }
  }

  // No valid cookie — get user's first client
  const clients = await getUserClients(userId);

  if (clients.length === 0) {
    return null;
  }

  // For admins, default to Brik Designs if available
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') {
    const brikDesigns = clients.find((c) => c.id === BRIK_DESIGNS_ID);
    if (brikDesigns) {
      return BRIK_DESIGNS_ID;
    }
  }

  // Return first available client
  return clients[0].id;
}

/**
 * Set the current client ID cookie
 */
export async function setCurrentClientId(clientId: string): Promise<void> {
  const cookieStore = await cookies();
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
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get all clients the user has access to
 */
export async function getUserClients(userId: string): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('client_users')
    .select(`
      client_id,
      clients (
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
    const client = cu.clients as unknown as { id: string; name: string } | null;
    return {
      id: cu.client_id,
      name: client?.name || 'Unknown Client',
    };
  });
}

/**
 * Get the current client from cookie (client-side version using document.cookie)
 */
export function getCurrentClientIdFromBrowser(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.split('=')[1] : null;
}

/**
 * Set the current client cookie (client-side version)
 */
export function setCurrentClientIdInBrowser(clientId: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = COOKIE_MAX_AGE;
  document.cookie = `${COOKIE_NAME}=${clientId}; max-age=${maxAge}; path=/; samesite=lax`;
}
