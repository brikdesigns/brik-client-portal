'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { useToast } from '@/components/toast-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface DeleteCompanyButtonProps {
  companyId: string;
  companyName: string;
}

export function DeleteCompanyButton({ companyId, companyName }: DeleteCompanyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      setLoading(false);
      setIsOpen(false);
      toastError(`Failed to delete ${companyName}`, error.message);
      return;
    }

    toastSuccess(`${companyName} deleted successfully`);
    router.push('/admin/companies');
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
        title="Delete company"
        description={`Are you sure you want to delete ${companyName}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={loading}
      />
    </>
  );
}
