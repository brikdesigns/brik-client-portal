'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { AlertBanner } from '@bds/components/ui/AlertBanner/AlertBanner';
import { space, shadow, border, gap } from '@/lib/tokens';

interface RunAnalysisButtonProps {
  clientId: string;
  slug: string;
}

const ANALYZABLE_TYPES = ['website', 'brand_logo', 'online_reviews', 'competitors'];

const spinnerKeyframes = `
@keyframes bds-toast-spin {
  to { transform: rotate(360deg); }
}
`;

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'bds-toast-spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6.5" stroke="var(--border-muted)" strokeWidth="2.5" />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="var(--text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RunAnalysisButton({ clientId, slug }: RunAnalysisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Auto-dismiss toast after completion
  useEffect(() => {
    if (progress === 'Complete!') {
      const timer = setTimeout(() => setToastVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  async function handleClick() {
    setLoading(true);
    setToastVisible(true);
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
        const data = await createRes.json();
        reportSetId = data.report_set_id;
      } else if (!createRes.ok) {
        const data = await createRes.json();
        console.error('Failed to create report set:', data.error);
        setProgress('');
        setToastVisible(false);
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
      setToastVisible(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinnerKeyframes }} />
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        loading={loading}
      >
        {loading ? 'Running...' : 'Start'}
      </Button>

      {toastVisible && progress && (
        <div
          style={{
            position: 'fixed',
            bottom: space.xl,
            right: space.xl,
            zIndex: 9999,
            maxWidth: '400px',
            boxShadow: shadow.lg,
            borderRadius: border.radius.sm,
          }}
        >
          <AlertBanner
            variant="information"
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.sm }}>
                {progress !== 'Complete!' && <Spinner />}
                {progress}
              </span>
            }
            description="Marketing analysis is running in the background."
          />
        </div>
      )}
    </>
  );
}
