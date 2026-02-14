'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createClient();

    async function handleCallback() {
      // 1. PKCE code flow (password reset, invite with PKCE)
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.push(next);
          router.refresh();
          return;
        }
      }

      // 2. Hash fragment flow (invite/magic link implicit flow)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Invite users need to set a password
            if (type === 'invite') {
              router.push('/reset-password');
            } else {
              router.push(next);
            }
            router.refresh();
            return;
          }
        }
      }

      // 3. Check if Supabase auto-detected a session from the URL
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(next);
        router.refresh();
        return;
      }

      // Nothing worked
      router.push('/login?error=auth_callback_failed');
    }

    handleCallback();
  }, [router, next, searchParams]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'var(--_typography---font-family--body)',
        color: 'var(--_color---text--secondary)',
      }}
    >
      Signing you in...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontFamily: 'var(--_typography---font-family--body)',
            color: 'var(--_color---text--secondary)',
          }}
        >
          Signing you in...
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
