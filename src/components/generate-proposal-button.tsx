'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { font, color, gap, space } from '@/lib/tokens';
import { text } from '@/lib/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

const NOTION_MEETINGS_URL = 'https://www.notion.so/brikdesigns/';

interface GenerateProposalButtonProps {
  companyId: string;
  companyName: string;
  slug: string;
  hideIcon?: boolean;
}

export function GenerateProposalButton({ companyId, companyName, slug, hideIcon }: GenerateProposalButtonProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showMeetingNotesModal, setShowMeetingNotesModal] = useState(false);

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
        if (data.error_code === 'NO_MEETING_NOTES') {
          setShowMeetingNotesModal(true);
          return;
        }
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
    <>
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
          loading={generating}
          onClick={handleGenerate}
        >
          {!hideIcon && <FontAwesomeIcon icon={faWandMagicSparkles} style={{ width: 12, height: 12 }} />} Generate
        </Button>
      </div>

      <Modal
        isOpen={showMeetingNotesModal}
        onClose={() => setShowMeetingNotesModal(false)}
        title="Meeting notes required"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowMeetingNotesModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                window.open(NOTION_MEETINGS_URL, '_blank');
              }}
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ width: 12, height: 12 }} />
              Open meetings database
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <p style={{ ...text.body, margin: 0 }}>
            No meeting notes found for <strong>{companyName}</strong> in Notion.
          </p>

          <div
            style={{
              backgroundColor: color.surface.secondary,
              borderRadius: 'var(--radius-sm)',
              padding: space.md,
            }}
          >
            <p style={{ ...text.body, fontWeight: 600, margin: `0 0 ${space.xs}` }}>
              Requirements
            </p>
            <ul style={{ ...text.body, margin: 0, paddingLeft: space.lg }}>
              <li>Create a discovery call page in the meetings database</li>
              <li>Title must include the company name (e.g. &ldquo;Discovery — {companyName}&rdquo;)</li>
              <li>Add meeting notes or call transcript to the page</li>
            </ul>
          </div>

          <p style={{ ...text.body, color: color.text.muted, margin: 0 }}>
            After creating the page, close this dialog, refresh the page, and try again. Or use the manual proposal builder.
          </p>
        </div>
      </Modal>
    </>
  );
}
