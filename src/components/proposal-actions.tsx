'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { useToast } from '@/components/toast-provider';
import { gap, color } from '@/lib/tokens';
import { text } from '@/lib/styles';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      let emailWarning = '';
      try {
        const emailRes = await fetch('/api/admin/email/proposal-sent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal_id: proposalId }),
        });
        if (!emailRes.ok) {
          const data = await emailRes.json().catch(() => ({ error: 'Unknown error' }));
          emailWarning = data.error || 'Email delivery failed';
        }
      } catch {
        emailWarning = 'Could not reach email service';
      }

      // Copy link to clipboard
      await navigator.clipboard.writeText(shareableLink);
      if (emailWarning) {
        toastSuccess(`Proposal marked sent — link copied. Email failed: ${emailWarning}`);
      } else {
        toastSuccess(`Proposal sent to ${companyName} — link copied`);
      }
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
    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) {
        toastError(`Failed to delete: ${error.message}`);
        return;
      }

      toastSuccess('Proposal deleted');
      setShowDeleteModal(false);
      router.push(`/admin/companies/${clientSlug}`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: gap.md }}>
        {status === 'draft' && (
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopyLink}>
              {copied ? 'Copied!' : 'Share'}
            </Button>
            <Button variant="primary" size="sm" loading={sending} onClick={handleSend}>
              Send Proposal
            </Button>
          </>
        )}
        {(status === 'sent' || status === 'viewed') && (
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Share'}
          </Button>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete proposal"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={deleting}
              onClick={handleDelete}
              style={{ backgroundColor: color.system.red, borderColor: color.system.red }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p style={{ ...text.body, margin: 0 }}>
          Are you sure you want to delete this proposal for <strong>{companyName}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
