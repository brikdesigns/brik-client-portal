'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';

const ANALYZABLE_TYPES = ['website', 'brand_logo', 'online_reviews', 'competitors'];

interface AnalyzeButtonProps {
  reportId: string;
  reportType: string;
}

export function AnalyzeButton({ reportId, reportType }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!ANALYZABLE_TYPES.includes(reportType)) return null;

  async function handleAnalyze() {
    setLoading(true);

    try {
      const res = await fetch('/api/admin/reporting/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, report_type: reportType }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Analysis failed:', data.error);
      }

      router.refresh();
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleAnalyze}
      disabled={loading}
    >
      {loading ? 'Analyzing...' : 'Re-analyze'}
    </Button>
  );
}
