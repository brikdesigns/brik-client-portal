'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '14px',
            color: 'var(--_color---text--primary)',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          Check your email for a password reset link. It may take a minute to arrive.
        </p>
        <a
          href="/login"
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '14px',
            color: 'var(--_color---system--link, #0034ea)',
            textDecoration: 'none',
          }}
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '24px' }}>
        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          error={error || undefined}
        />
      </div>

      <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
        {loading ? 'Sending...' : 'Send reset link'}
      </Button>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <a
          href="/login"
          style={{
            color: 'var(--_color---system--link, #0034ea)',
            fontSize: 'var(--_typography---body--sm)',
            fontFamily: 'var(--_typography---font-family--body)',
            textDecoration: 'none',
          }}
        >
          Back to sign in
        </a>
      </div>
    </form>
  );
}
