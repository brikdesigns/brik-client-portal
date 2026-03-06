'use client';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color } from '@/lib/tokens';

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { showWarning, secondsLeft, dismissWarning } = useSessionTimeout();

  return (
    <>
      {children}
      <Modal
        isOpen={showWarning}
        onClose={dismissWarning}
        title="Session expiring"
        size="sm"
        closeOnBackdrop={false}
        showCloseButton={false}
        footer={
          <Button variant="primary" size="md" onClick={dismissWarning}>
            Stay signed in
          </Button>
        }
      >
        <p style={{ margin: 0, textAlign: 'center' }}>
          You&apos;ll be signed out in{' '}
          <span style={{ fontWeight: font.weight.semibold, color: color.text.primary }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>{' '}
          due to inactivity.
        </p>
      </Modal>
    </>
  );
}
