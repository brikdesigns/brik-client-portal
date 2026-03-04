'use client';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { Button } from '@bds/components/ui/Button/Button';

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
              backgroundColor: 'var(--_color---surface--primary, white)',
              borderRadius: 'var(--_border-radius---lg, 12px)',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: 'var(--_box-shadow---lg, 0 8px 32px rgba(0,0,0,0.2))',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: 'var(--_typography---heading--small, 18px)',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: '0 0 8px',
              }}
            >
              Session expiring
            </h2>
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: 'var(--_typography---body--md-base, 14px)',
                color: 'var(--_color---text--secondary)',
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}
            >
              You&apos;ll be signed out in{' '}
              <span style={{ fontWeight: 600, color: 'var(--_color---text--primary)' }}>
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
