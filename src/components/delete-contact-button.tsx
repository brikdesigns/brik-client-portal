'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface DeleteContactButtonProps {
  contactId: string;
  contactName: string;
  hasPortalAccess: boolean;
}

export function DeleteContactButton({ contactId, contactName, hasPortalAccess }: DeleteContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toastError(`Failed to delete ${contactName}`, data.error || 'Unknown error');
        return;
      }

      toastSuccess(`${contactName} deleted`);
      router.push('/admin/contacts');
      router.refresh();
    } catch {
      toastError('Failed to delete contact', 'Network error');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  const description = hasPortalAccess
    ? `Are you sure you want to delete ${contactName}? This removes the contact record but does NOT delete their portal login. You can manage their user account separately.`
    : `Are you sure you want to delete ${contactName}? This action cannot be undone.`;

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Delete contact"
        description={description}
        confirmLabel="Delete"
        loading={loading}
      />
    </>
  );
}
