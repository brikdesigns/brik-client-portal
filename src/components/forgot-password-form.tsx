'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space } from '@/lib/tokens';

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
            fontFamily: font.family.body,
            fontSize: font.size.body.sm,
            color: color.text.primary,
            marginBottom: space.lg,
            lineHeight: font.lineHeight.relaxed,
          }}
        >
          Check your email for a password reset link. It may take a minute to arrive.
        </p>
        <a
          href="/login"
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.sm,
            color: color.system.link,
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
      <div style={{ marginBottom: space.lg }}>
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

      <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
        Send reset link
      </Button>

      <div style={{ textAlign: 'center', marginTop: space.md }}>
        <a
          href="/login"
          style={{
            color: color.system.link,
            fontSize: font.size.body.sm,
            fontFamily: font.family.body,
            textDecoration: 'none',
          }}
        >
          Back to sign in
        </a>
      </div>
    </form>
  );
}
