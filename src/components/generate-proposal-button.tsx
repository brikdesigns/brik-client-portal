'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { Select } from '@bds/components/ui/Select/Select';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
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

const SECTION_STEPS = [
  { type: 'overview_and_goals', label: 'Writing overview...' },
  { type: 'scope_of_project', label: 'Writing scope...' },
  { type: 'project_timeline', label: 'Writing timeline...' },
  { type: 'why_brik', label: 'Finalizing proposal...' },
] as const;

export function GenerateProposalButton({ companyId, companyName, slug, label = 'Get started' }: GenerateProposalButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState('');
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  const fetchAndOpen = useCallback(async () => {
    setLoadingNotes(true);
    setError('');
    setSelectedNoteId('');
    setProposalTitle(`Proposal for ${companyName}`);
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

  /** Helper: POST JSON and return parsed response or throw */
  async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        res.status === 504 || res.status === 502
          ? 'Request timed out. Try again or use Manual mode.'
          : `Server error (${res.status}). Try again or use Manual mode.`
      );
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data as T;
  }

  async function handleGenerate() {
    if (!selectedNoteId) {
      setError('Select a meeting note to continue.');
      return;
    }

    setGenerating(true);
    setError('');
    setProgressStep('Analyzing meeting notes...');

    try {
      // Step 1: Recommend services + create proposal shell (~15-20s)
      const shell = await postJSON<{
        proposal_id: string;
        company_id: string;
        slug: string;
        service_ids: string[];
        meeting_notes_content: string;
      }>('/api/admin/proposals/auto-generate', {
        company_id: companyId,
        meeting_note_page_id: selectedNoteId,
        title: proposalTitle.trim() || undefined,
      });

      // Step 2: Generate each section sequentially (~15-20s each)
      for (const step of SECTION_STEPS) {
        setProgressStep(step.label);
        await postJSON('/api/admin/proposals/generate/section', {
          company_id: companyId,
          proposal_id: shell.proposal_id,
          service_ids: shell.service_ids,
          meeting_notes_content: shell.meeting_notes_content,
          section_type: step.type,
        });
      }

      // Done — redirect to proposal
      setShowModal(false);
      router.push(`/admin/companies/${slug}/proposals/${shell.proposal_id}`);
      router.refresh();
    } catch (err) {
      console.error('Auto-generate failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
      setProgressStep('');
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
            <Button variant="ghost" size="md" onClick={() => setShowModal(false)} disabled={generating}>
              Cancel
            </Button>
            <Button variant="secondary" size="md" onClick={handleManual} disabled={generating}>
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

          <TextInput
            label="Proposal title"
            value={proposalTitle}
            onChange={(e) => setProposalTitle(e.target.value)}
            placeholder={`Proposal for ${companyName}`}
            size="md"
          />

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

          {generating && progressStep && (
            <p
              style={{
                ...text.body,
                color: color.text.muted,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {progressStep}
            </p>
          )}

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
