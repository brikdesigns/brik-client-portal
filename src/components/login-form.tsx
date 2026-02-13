'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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
      <div style={{ marginBottom: '16px' }}>
        <Input
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
        <Input
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
        size="lg"
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
