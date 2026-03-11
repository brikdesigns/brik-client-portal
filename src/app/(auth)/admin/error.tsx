'use client';

import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <Button variant="secondary" size="md" asLink href="/admin">
          Back to overview
        </Button>
      </div>
    </div>
  );
}
