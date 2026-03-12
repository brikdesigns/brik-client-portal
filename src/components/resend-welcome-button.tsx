'use client';

import { useState } from 'react';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';

interface ResendWelcomeButtonProps {
  contactId: string;
  contactName: string;
}

export function ResendWelcomeButton({ contactId, contactName }: ResendWelcomeButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();

  async function handleResend() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toastError(data.error || 'Failed to send welcome email');
        return;
      }

      toastSuccess(`Welcome email sent to ${contactName}`);
    } catch {
      toastError('Failed to send welcome email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleResend} loading={loading}>
      Resend Welcome
    </Button>
  );
}
