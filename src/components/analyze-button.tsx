'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@bds/components/ui/Button/Button';
import { analyzeWebsite } from '@/lib/analysis/website';
import { recalculateReportScore, recalculateReportSetScore } from '@/lib/analysis/scoring';
import { WEBSITE_CONFIG } from '@/lib/analysis/report-config';

interface AnalyzeButtonProps {
  reportId: string;
  reportSetId: string;
  reportType: string;
  websiteUrl: string | null;
}

export function AnalyzeButton({ reportId, reportSetId, reportType, websiteUrl }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Only website reports support auto-analysis for now
  if (reportType !== 'website' || !websiteUrl) return null;

  async function handleAnalyze() {
    if (!websiteUrl) return;
    setLoading(true);

    try {
      const results = await analyzeWebsite(websiteUrl);
      const supabase = createClient();

      // Update each report item with analysis results
      const { data: items } = await supabase
        .from('report_items')
        .select('id, category, sort_order')
        .eq('report_id', reportId)
        .order('sort_order', { ascending: true });

      if (items) {
        for (const item of items) {
          const result = results.find((r) => r.category === item.category);
          if (result && result.score !== null) {
            const catConfig = WEBSITE_CONFIG.categories.find((c) => c.category === item.category);
            await supabase
              .from('report_items')
              .update({
                status: result.status,
                score: result.score,
                feedback_summary: result.feedback_summary,
                notes: result.notes,
                metadata: {
                  maxScore: catConfig?.maxScore ?? 5,
                  ...result.metadata,
                },
              })
              .eq('id', item.id);
          }
        }
      }

      // Cascade recalculation
      await recalculateReportScore(supabase, reportId);
      await recalculateReportSetScore(supabase, reportSetId);

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
