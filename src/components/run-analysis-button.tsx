'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, gap } from '@/lib/tokens';

interface RunAnalysisButtonProps {
  clientId: string;
  slug: string;
}

const ANALYZABLE_TYPES = ['website', 'brand_logo', 'online_reviews', 'competitors'];

export function RunAnalysisButton({ clientId, slug }: RunAnalysisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  async function handleClick() {
    setLoading(true);
    setProgress('Creating report set...');

    try {
      // Step 1: Create report set with empty templates
      const createRes = await fetch('/api/admin/reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: clientId }),
      });

      let reportSetId: string;

      if (createRes.status === 409) {
        // Already exists — use existing
        const data = await createRes.json();
        reportSetId = data.report_set_id;
      } else if (!createRes.ok) {
        const data = await createRes.json();
        console.error('Failed to create report set:', data.error);
        setProgress('');
        return;
      } else {
        const data = await createRes.json();
        reportSetId = data.report_set_id;
      }

      // Step 2: Fetch the report IDs we just created
      const reportsRes = await fetch(`/api/admin/reporting?report_set_id=${reportSetId}`);
      if (!reportsRes.ok) {
        console.error('Failed to fetch reports');
        router.push(`/admin/companies/${slug}?tab=reporting`);
        router.refresh();
        return;
      }
      const { reports } = await reportsRes.json() as { reports: { id: string; report_type: string }[] };

      // Step 3: Run all analyzable reports in parallel
      const analyzable = reports.filter((r) => ANALYZABLE_TYPES.includes(r.report_type));
      let completed = 0;

      setProgress(`Analyzing 0 of ${analyzable.length}...`);

      const analyzePromises = analyzable.map(async (report) => {
        try {
          const res = await fetch('/api/admin/reporting/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              report_id: report.id,
              report_type: report.report_type,
              skip_email: true,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            console.error(`Analysis failed for ${report.report_type}:`, data.error);
          }
        } catch (err) {
          console.error(`Analysis error for ${report.report_type}:`, err);
        } finally {
          completed++;
          setProgress(`Analyzing ${completed} of ${analyzable.length}...`);
        }
      });

      await Promise.all(analyzePromises);

      setProgress('Complete!');
      router.push(`/admin/companies/${slug}?tab=reporting`);
      router.refresh();
    } catch (err) {
      console.error('Analysis request failed:', err);
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        loading={loading}
      >
        {loading ? 'Running...' : 'Start'}
      </Button>
      {progress && (
        <span style={{
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          color: color.text.muted,
        }}>
          {progress}
        </span>
      )}
    </div>
  );
}
