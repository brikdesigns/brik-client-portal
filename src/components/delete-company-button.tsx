'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';

interface DeleteCompanyButtonProps {
  companyId: string;
  companyName: string;
}

export function DeleteCompanyButton({ companyId, companyName }: DeleteCompanyButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      alert(`Failed to delete ${companyName}: ${error.message}`);
      return;
    }

    router.push('/admin/companies');
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}
