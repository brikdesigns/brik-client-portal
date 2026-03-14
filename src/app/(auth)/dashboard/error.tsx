'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@bds/components/ui/Button/Button';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { font, color, space, gap } from '@/lib/tokens';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: gap.lg,
        textAlign: 'center',
        padding: space.xl,
      }}
    >
      <h2
        style={{
          fontFamily: font.family.heading,
          fontSize: font.size.heading.medium,
          fontWeight: font.weight.semibold,
          color: color.text.primary,
          margin: 0,
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontFamily: font.family.body,
          fontSize: font.size.body.md,
          color: color.text.muted,
          margin: 0,
          maxWidth: '480px',
        }}
      >
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: gap.md }}>
        <Button variant="primary" size="md" onClick={() => reset()}>
          Try again
        </Button>
        <LinkButton variant="secondary" size="md" href="/dashboard">
          Back to dashboard
        </LinkButton>
      </div>
    </div>
  );
}
