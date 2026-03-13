'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface RemoveServiceButtonProps {
  /** company_services.id — for assigned services */
  assignmentId?: string;
  /** proposal_items.id — for prospective services from a proposal */
  proposalItemId?: string;
  serviceName: string;
  companySlug: string;
  companyType: string;
}

export function RemoveServiceButton({
  assignmentId,
  proposalItemId,
  serviceName,
  companySlug,
  companyType,
}: RemoveServiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const isProspect = companyType === 'lead' || companyType === 'prospect';

  async function handleConfirm() {
    setLoading(true);

    try {
      if (proposalItemId) {
        // Prospective service: remove from proposal only
        const res = await fetch(`/api/admin/proposal-items/${proposalItemId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          toastError('Failed to remove service from proposal', data.error);
          return;
        }
        toastSuccess(`${serviceName} removed from proposal`);
      } else if (assignmentId && isProspect) {
        // Assigned service on prospect: delete assignment + update proposal
        const res = await fetch(`/api/admin/company-services/${assignmentId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          toastError('Failed to remove service', data.error);
          return;
        }
        const msg = data.proposal_updated
          ? `${serviceName} removed and proposal updated`
          : `${serviceName} removed`;
        toastSuccess(msg);
      } else if (assignmentId) {
        // Client: deactivate
        const res = await fetch(`/api/admin/company-services/${assignmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        const data = await res.json();
        if (!res.ok) {
          toastError('Failed to deactivate service', data.error);
          return;
        }
        toastSuccess(`${serviceName} deactivated`);
      }
      router.refresh();
    } catch {
      toastError('Request failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  const title = isProspect ? 'Remove service' : 'Deactivate service';
  const description = proposalItemId
    ? `Are you sure you want to remove ${serviceName}? This will remove it from the proposal and recalculate the total.`
    : isProspect
      ? `Are you sure you want to remove ${serviceName}? This will also remove it from any active proposal.`
      : `Are you sure you want to deactivate ${serviceName}? The service will remain in the record with an inactive status.`;
  const confirmLabel = isProspect ? 'Remove' : 'Deactivate';

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        {isProspect ? 'Remove' : 'Deactivate'}
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        loading={loading}
      />
    </>
  );
}
