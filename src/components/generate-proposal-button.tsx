'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { Select } from '@bds/components/ui/Select/Select';
import { color, space } from '@/lib/tokens';
import { text } from '@/lib/styles';

interface MeetingNote {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
}

interface GenerateProposalButtonProps {
  companyId: string;
  companyName: string;
  slug: string;
  label?: string;
}

export function GenerateProposalButton({ companyId, companyName, slug, label = 'Get started' }: GenerateProposalButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  const fetchAndOpen = useCallback(async () => {
    setLoadingNotes(true);
    setError('');
    setSelectedNoteId('');
    setMeetingNotes([]);

    try {
      const res = await fetch(
        `/api/admin/proposals/meeting-notes?company_name=${encodeURIComponent(companyName)}`
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        setMeetingNotes(results);
        if (results.length === 1) {
          setSelectedNoteId(results[0].id);
        }
      }
    } catch {
      // Silent fail — modal will show empty state
    } finally {
      setLoadingNotes(false);
      setShowModal(true);
    }
  }, [companyName]);

  async function handleGenerate() {
    if (!selectedNoteId) {
      setError('Select a meeting note to continue.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/proposals/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          meeting_note_page_id: selectedNoteId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed.');
        return;
      }

      setShowModal(false);
      router.push(`/admin/companies/${slug}/proposals/${data.proposal_id}`);
      router.refresh();
    } catch (err) {
      console.error('Auto-generate failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
    }
  }

  function handleManual() {
    setShowModal(false);
    router.push(`/admin/companies/${slug}/proposals/new`);
  }

  const selectedNote = meetingNotes.find((n) => n.id === selectedNoteId);

  return (
    <>
      <Button variant="primary" size="sm" onClick={fetchAndOpen} loading={loadingNotes}>
        {label}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Begin proposal"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" size="md" onClick={handleManual}>
              Manual
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              loading={generating}
              disabled={!selectedNoteId}
            >
              Begin
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <p style={{ ...text.body, margin: 0 }}>
            Select the discovery call note for <strong>{companyName}</strong>. The AI will
            analyze the conversation, recommend services, and draft the full proposal.
          </p>

          <Select
            label="Meeting note"
            placeholder={meetingNotes.length === 0
              ? `No meeting notes found for "${companyName}"`
              : 'Select a meeting note...'}
            options={meetingNotes.map((note) => ({
              label: note.title,
              value: note.id,
            }))}
            value={selectedNoteId}
            onChange={(e) => {
              setSelectedNoteId(e.target.value);
              setError('');
            }}
            helperText={selectedNote
              ? `Last edited ${new Date(selectedNote.lastEdited).toLocaleDateString()}`
              : undefined}
            size="md"
          />

          {error && (
            <p
              style={{
                ...text.body,
                color: color.system.red,
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
