'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      setLoading(false);
      setIsOpen(false);
      toastError(`Failed to delete ${projectName}`, error.message);
      return;
    }

    toastSuccess(`${projectName} deleted successfully`);
    router.push('/admin/projects');
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Delete project"
        description={`Are you sure you want to delete "${projectName}"? This will also remove all associated service assignments. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={loading}
      />
    </>
  );
}
