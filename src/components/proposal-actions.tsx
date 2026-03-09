'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';
import { gap } from '@/lib/tokens';

interface ProposalActionsProps {
  proposalId: string;
  status: string;
  shareableLink: string;
  clientSlug: string;
  companyName: string;
}

export function ProposalActions({ proposalId, status, shareableLink, clientSlug, companyName }: ProposalActionsProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('proposals')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (error) {
        toastError(`Failed to send: ${error.message}`);
        return;
      }

      // Send email to primary contact
      try {
        await fetch('/api/admin/email/proposal-sent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal_id: proposalId }),
        });
      } catch {
        // Email is non-blocking — proposal is already marked as sent
        console.error('Email send failed (non-critical)');
      }

      // Copy link to clipboard
      await navigator.clipboard.writeText(shareableLink);
      toastSuccess(`Proposal sent to ${companyName}`);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    const supabase = createClient();
    setDeleting(true);
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId);

    if (error) {
      toastError(`Failed to delete: ${error.message}`);
      setDeleting(false);
      return;
    }

    router.push(`/admin/companies/${clientSlug}`);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: gap.md }}>
      {status === 'draft' && (
        <>
          <Button variant="secondary" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" size="sm" loading={sending} onClick={handleSend}>
            Send & Copy Link
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
