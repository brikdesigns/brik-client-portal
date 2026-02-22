'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';

interface RunAnalysisButtonProps {
  clientId: string;
  slug: string;
}

export function RunAnalysisButton({ clientId, slug }: RunAnalysisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: clientId }),
      });

      if (res.ok) {
        router.push(`/admin/reporting/${slug}`);
        router.refresh();
      } else {
        const data = await res.json();
        if (res.status === 409 && data.report_set_id) {
          // Already exists — redirect to it
          router.push(`/admin/reporting/${slug}`);
        } else {
          console.error('Failed to create report set:', data.error);
        }
      }
    } catch (err) {
      console.error('Analysis request failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Analyzing...' : 'Start'}
    </Button>
  );
}
