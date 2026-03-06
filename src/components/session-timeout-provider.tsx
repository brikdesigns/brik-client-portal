'use client';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, border, shadow } from '@/lib/tokens';

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { showWarning, secondsLeft, dismissWarning } = useSessionTimeout();

  return (
    <>
      {children}
      {showWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              backgroundColor: color.surface.primary,
              borderRadius: border.radius.lg,
              padding: space.xl,
              maxWidth: '400px',
              width: '90%',
              boxShadow: shadow.lg,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: font.family.heading,
                fontSize: font.size.heading.small,
                fontWeight: font.weight.semibold,
                color: color.text.primary,
                margin: `0 0 ${space.xs}`,
              }}
            >
              Session expiring
            </h2>
            <p
              style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.md,
                color: color.text.secondary,
                margin: `0 0 ${space.lg}`,
                lineHeight: font.lineHeight.normal,
              }}
            >
              You&apos;ll be signed out in{' '}
              <span style={{ fontWeight: font.weight.semibold, color: color.text.primary }}>
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>{' '}
              due to inactivity.
            </p>
            <Button variant="primary" size="md" onClick={dismissWarning}>
              Stay signed in
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
