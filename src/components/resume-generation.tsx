'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { color, space } from '@/lib/tokens';
import { text } from '@/lib/styles';

const SECTION_STEPS = [
  { type: 'overview_and_goals', label: 'Writing overview...' },
  { type: 'scope_of_project', label: 'Writing scope...' },
  { type: 'project_timeline', label: 'Writing timeline...' },
  { type: 'why_brik', label: 'Finalizing proposal...' },
] as const;

interface ResumeGenerationProps {
  proposalId: string;
  /** Section types already present on the proposal (to skip) */
  existingSectionTypes: string[];
}

export function ResumeGeneration({ proposalId, existingSectionTypes }: ResumeGenerationProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState('');

  const missingSections = SECTION_STEPS.filter(
    s => !existingSectionTypes.includes(s.type)
  );

  // Nothing to resume if all sections are present
  if (missingSections.length === 0) return null;

  async function handleResume() {
    setGenerating(true);
    setError('');

    try {
      for (const step of missingSections) {
        setProgressStep(step.label);
        const res = await fetch('/api/admin/proposals/generate/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposal_id: proposalId,
            section_type: step.type,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(
            res.status === 504 || res.status === 502
              ? 'Request timed out. Try again.'
              : `Server error (${res.status}). Try again.`
          );
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
      setProgressStep('');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: space.sm,
        padding: space.md,
        backgroundColor: color.surface.warning,
        borderRadius: '8px',
        marginBottom: space.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
        <div style={{ flex: 1 }}>
          <p style={{ ...text.body, margin: 0, fontWeight: 500 }}>
            Proposal generation incomplete
          </p>
          <p style={{ ...text.body, margin: 0, color: color.text.muted, fontSize: 'var(--_font-size---label--md)' }}>
            {missingSections.length} of 4 sections still need to be generated.
            {generating && progressStep ? ` ${progressStep}` : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={generating}
          onClick={handleResume}
        >
          Resume
        </Button>
      </div>
      {error && (
        <p style={{ ...text.body, color: color.system.red, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
