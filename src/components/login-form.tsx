'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';

const SESSION_MESSAGES: Record<string, string> = {
  idle: 'You were signed out due to inactivity.',
  max_session: 'Your session has expired. Please sign in again.',
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionReason = searchParams.get('session');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If there's an explicit redirect param, use it
      const explicitRedirect = searchParams.get('redirect');
      if (explicitRedirect) {
        router.push(explicitRedirect);
        router.refresh();
        return;
      }

      // Check role and update last_login_at
      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        // Track login timestamp (fire-and-forget)
        supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', authData.user.id)
          .then();

        router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {sessionReason && SESSION_MESSAGES[sessionReason] && (
        <div
          style={{
            backgroundColor: 'var(--_color---surface--secondary, #f5f5f5)',
            border: '1px solid var(--_color---border--primary)',
            borderRadius: 'var(--_border-radius---sm, 6px)',
            padding: '12px 16px',
            marginBottom: '16px',
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--sm)',
            color: 'var(--_color---text--secondary)',
          }}
        >
          {SESSION_MESSAGES[sessionReason]}
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <TextInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          error={error || undefined}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <a
          href="/forgot-password"
          style={{
            color: 'var(--_color---system--link, #0034ea)',
            fontSize: 'var(--_typography---body--sm)',
            fontFamily: 'var(--_typography---font-family--body)',
            textDecoration: 'none',
          }}
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}
