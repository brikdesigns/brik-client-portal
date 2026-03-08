'use client';

import { Modal } from '@bds/components/ui/Modal/Modal';
import { Button } from '@bds/components/ui/Button/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

/**
 * Reusable confirmation dialog for destructive actions.
 *
 * Wraps the BDS Modal with a standard confirm/cancel footer.
 * Use for delete, archive, or any irreversible operation.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{description}</p>
    </Modal>
  );
}
