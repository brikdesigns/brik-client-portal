'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

interface GenerateProposalButtonProps {
  companyId: string;
  slug: string;
}

export function GenerateProposalButton({ companyId, slug }: GenerateProposalButtonProps) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {error && (
        <span
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '12px',
            color: 'var(--system--red, #eb5757)',
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
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ width: 12, height: 12 }} /> Generate Proposal
          </>
        )}
      </Button>
    </div>
  );
}
