'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';

interface QualifyLeadButtonProps {
  companyId: string;
}

export function QualifyLeadButton({ companyId }: QualifyLeadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleQualify() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('companies')
      .update({ type: 'prospect', status: 'needs_proposal' })
      .eq('id', companyId);

    if (error) {
      alert(`Failed to qualify: ${error.message}`);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <Button variant="primary" size="sm" onClick={handleQualify} disabled={loading}>
      {loading ? 'Qualifying...' : 'Qualify Lead'}
    </Button>
  );
}
