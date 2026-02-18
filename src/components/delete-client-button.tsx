'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';

interface DeleteClientButtonProps {
  clientId: string;
  clientName: string;
}

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      alert(`Failed to delete ${clientName}: ${error.message}`);
      return;
    }

    router.push('/admin/clients');
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}
