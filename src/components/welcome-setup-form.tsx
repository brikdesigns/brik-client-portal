'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { PasswordInput } from '@bds/components/ui/PasswordInput/PasswordInput';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';

interface WelcomeSetupFormProps {
  token: string;
  contactEmail: string;
  contactName: string;
}

export function WelcomeSetupForm({ token, contactEmail, contactName }: WelcomeSetupFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/welcome/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || 'Something went wrong.');
        return;
      }

      setSuccess(true);

      // Brief pause so user sees success, then redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.small,
            color: color.system.green,
            fontWeight: font.weight.semibold,
            marginBottom: gap.sm,
          }}
        >
          Account created!
        </p>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
          }}
        >
          Redirecting you to sign in...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: space.md }}>
        <TextInput
          label="Email"
          type="email"
          value={contactEmail}
          disabled
          fullWidth
        />
      </div>

      <div style={{ marginBottom: space.md }}>
        <TextInput
          label="Name"
          type="text"
          value={contactName}
          disabled
          fullWidth
        />
      </div>

      <div style={{ marginBottom: space.md }}>
        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
      </div>

      <div style={{ marginBottom: space.lg }}>
        <PasswordInput
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          error={error || undefined}
        />
      </div>

      <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
        Create account
      </Button>

      <p
        style={{
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          color: color.text.muted,
          textAlign: 'center',
          marginTop: space.lg,
          lineHeight: font.lineHeight.relaxed,
        }}
      >
        By creating an account, you agree to our terms of service.
      </p>
    </form>
  );
}
