/**
 * Client-side cookie management for current client selection
 * Safe to import in Client Components
 */

const COOKIE_NAME = 'current_client_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

/**
 * Clear the current client cookie (client-side version)
 */
export function clearCurrentClientIdInBrowser(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/;`;
}
