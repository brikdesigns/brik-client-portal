'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';

interface AgreementActionsProps {
  agreementId: string;
  status: string;
  shareableLink: string;
  clientSlug: string;
}

export function AgreementActions({ agreementId, status, shareableLink, clientSlug }: AgreementActionsProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSend() {
    const supabase = createClient();
    const { error } = await supabase
      .from('agreements')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', agreementId);

    if (error) {
      alert(`Failed to send: ${error.message}`);
      return;
    }

    // Copy link to clipboard
    await navigator.clipboard.writeText(shareableLink);
    router.refresh();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from('agreements')
      .delete()
      .eq('id', agreementId);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }

    router.push(`/admin/companies/${clientSlug}`);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--_space---gap--md)' }}>
      {status === 'draft' && (
        <>
          <Button variant="secondary" size="sm" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend}>
            Send &amp; Copy Link
          </Button>
        </>
      )}
      {(status === 'sent' || status === 'viewed') && (
        <Button variant="secondary" size="sm" onClick={handleCopyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      )}
    </div>
  );
}
