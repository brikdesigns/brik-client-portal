'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, gap } from '@/lib/tokens';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

interface GenerateProposalButtonProps {
  companyId: string;
  slug: string;
  hideIcon?: boolean;
}

export function GenerateProposalButton({ companyId, slug, hideIcon }: GenerateProposalButtonProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/proposals/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed.');
        return;
      }

      router.push(`/admin/companies/${slug}/proposals/${data.proposal_id}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
      {error && (
        <span
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.xs,
            color: color.system.red,
            maxWidth: '300px',
          }}
        >
          {error}
        </span>
      )}
      <Button
        variant="primary"
        size="sm"
        disabled={generating}
        onClick={handleGenerate}
      >
        {generating ? (
          'Generating...'
        ) : (
          <>
            {!hideIcon && <FontAwesomeIcon icon={faWandMagicSparkles} style={{ width: 12, height: 12 }} />} Generate
          </>
        )}
      </Button>
    </div>
  );
}
