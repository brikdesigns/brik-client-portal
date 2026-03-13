'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@bds/components/ui/Button/Button';
import { Select } from '@bds/components/ui/Select/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { font, color, space, gap, border } from '@/lib/tokens';
import { text } from '@/lib/styles';

interface MeetingNote {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
}

interface RewriteNotesPickerProps {
  companyName: string;
  /** The meeting notes content currently stored on the proposal */
  currentMeetingNotes: string;
  /** Called when user selects a new note and clicks Rewrite */
  onRewrite: (notes: { content: string; url?: string }) => void;
  /** Called when user wants to rewrite with the existing notes */
  onRewriteWithExisting: () => void;
  generating: boolean;
  generatingStep: string;
}

export function RewriteNotesPicker({
  companyName,
  currentMeetingNotes,
  onRewrite,
  onRewriteWithExisting,
  generating,
  generatingStep,
}: RewriteNotesPickerProps) {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState('');

  const hasExistingNotes = currentMeetingNotes && currentMeetingNotes.trim().length > 50;

  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/proposals/meeting-notes?company_name=${encodeURIComponent(companyName)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMeetingNotes(data.results || []);
      }
    } catch {
      // Silent fail — select will show empty state
    } finally {
      setLoadingNotes(false);
    }
  }, [companyName]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleRewriteWithNewNote() {
    if (!selectedNoteId) return;
    setLoadingContent(true);
    setError('');

    try {
      // Fetch the full content of the selected meeting note
      const res = await fetch(
        `/api/admin/proposals/meeting-notes?page_id=${encodeURIComponent(selectedNoteId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch note content');

      const content = data.content as string;
      if (!content || content.trim().length < 50) {
        setError('The selected meeting note has insufficient content (less than 50 characters).');
        return;
      }

      const selectedNote = meetingNotes.find(n => n.id === selectedNoteId);
      onRewrite({ content, url: selectedNote?.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch note content.');
    } finally {
      setLoadingContent(false);
    }
  }

  const selectedNote = meetingNotes.find(n => n.id === selectedNoteId);
  const iconSize = { width: 14, height: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
      <p style={{ ...text.body, margin: 0 }}>
        Rewrite all proposal sections for <strong>{companyName}</strong>.
        {hasExistingNotes
          ? ' You can use the current meeting notes or select a different one.'
          : ' Select a meeting note to use as the basis for regeneration.'}
      </p>

      {/* Current notes option */}
      {hasExistingNotes && (
        <button
          type="button"
          onClick={onRewriteWithExisting}
          disabled={generating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: gap.md,
            padding: `${space.sm} ${space.md}`,
            border: `${border.width.sm} solid ${color.border.muted}`,
            borderRadius: border.radius.md,
            backgroundColor: 'transparent',
            cursor: generating ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: font.family.body,
            opacity: generating ? 0.6 : 1,
          }}
        >
          <FontAwesomeIcon
            icon={faFileLines}
            style={{ ...iconSize, color: color.text.muted }}
          />
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: font.family.label,
              fontWeight: font.weight.medium,
              fontSize: font.size.body.sm,
              color: color.text.primary,
              margin: 0,
            }}>
              Rewrite with current notes
            </p>
            <p style={{
              fontSize: font.size.body.xs,
              color: color.text.muted,
              margin: `${gap.tiny} 0 0`,
            }}>
              {currentMeetingNotes.slice(0, 80).trim()}...
            </p>
          </div>
        </button>
      )}

      {/* Divider */}
      {hasExistingNotes && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: gap.md,
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: color.border.muted }} />
          <span style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.xs,
            color: color.text.muted,
          }}>
            or select a different note
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: color.border.muted }} />
        </div>
      )}

      {/* Meeting note selector */}
      <Select
        label="Meeting note"
        placeholder={loadingNotes
          ? 'Searching Notion...'
          : meetingNotes.length === 0
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
        disabled={generating || loadingNotes}
      />

      <Button
        variant="primary"
        size="md"
        onClick={handleRewriteWithNewNote}
        loading={loadingContent || generating}
        disabled={!selectedNoteId || generating}
      >
        {generating
          ? (generatingStep || 'Generating...')
          : 'Rewrite with selected note'}
      </Button>

      {error && (
        <p style={{ ...text.body, color: color.system.red, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
