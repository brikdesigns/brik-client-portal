'use client';

import { useState, useEffect } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faCheck, faSpinner, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { font, color, gap, space, border } from '@/lib/tokens';

interface MeetingPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
}

interface MeetingNotesPickerProps {
  companyId: string;
  companyName: string;
  onNotesLoaded: (notes: string, url: string) => void;
}

export function MeetingNotesPicker({ companyId, companyName, onNotesLoaded }: MeetingNotesPickerProps) {
  const [meetings, setMeetings] = useState<MeetingPage[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Auto-search by company name on mount
  useEffect(() => {
    searchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function searchMeetings() {
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/proposals/generate?company_id=${companyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeetings(data.meetings || []);
      if (data.meetings?.length === 0) {
        setError(`No meeting notes found for "${companyName}". Try pasting a Notion URL below.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search Notion');
    } finally {
      setSearching(false);
    }
  }

  function selectMeeting(meeting: MeetingPage) {
    setSelectedId(meeting.id);
    setLoaded(true);
    onNotesLoaded('', meeting.url);
  }

  const sectionStyle = {
    fontFamily: font.family.heading,
    fontSize: font.size.heading.small,
    fontWeight: font.weight.semibold,
    color: color.text.primary,
    margin: `0 0 ${gap.sm}`,
  };

  const bodyStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.secondary,
    margin: `0 0 ${space.md}`,
  };

  const iconSize = { width: 14, height: 14 };

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: space.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: gap.xs }}>
        <h2 style={sectionStyle}>Meeting Notes</h2>
        {!searching && (
          <Button type="button" variant="ghost" size="sm" onClick={searchMeetings}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={iconSize} /> Search Again
          </Button>
        )}
      </div>
      <p style={bodyStyle}>
        Discovery call transcript from Notion. Auto-searched by &quot;{companyName}&quot;.
      </p>

      {searching && (
        <div style={{ textAlign: 'center', padding: `${space.lg} 0`, color: color.text.muted }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ width: 16, height: 16, marginBottom: space.tiny }} />
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, margin: 0 }}>
            Searching Notion for &quot;{companyName}&quot;...
          </p>
        </div>
      )}

      {!searching && meetings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm, marginBottom: space.md }}>
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => selectMeeting(meeting)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: gap.md,
                padding: `${space.sm} ${space.md}`,
                border: selectedId === meeting.id
                  ? `2px solid ${color.brand.primary}`
                  : `${border.width.sm} solid ${color.border.muted}`,
                borderRadius: border.radius.md,
                backgroundColor: selectedId === meeting.id
                  ? color.surface.secondary
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: font.family.body,
              }}
            >
              <FontAwesomeIcon
                icon={selectedId === meeting.id ? faCheck : faFileLines}
                style={{
                  ...iconSize,
                  color: selectedId === meeting.id
                    ? color.brand.primary
                    : color.text.muted,
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: font.family.label,
                  fontWeight: font.weight.semibold,
                  fontSize: font.size.body.sm,
                  color: color.text.primary,
                  margin: 0,
                }}>
                  {meeting.title}
                </p>
                {meeting.lastEdited && (
                  <p style={{
                    fontSize: font.size.body.xs,
                    color: color.text.muted,
                    margin: '2px 0 0',
                  }}>
                    Last edited: {new Date(meeting.lastEdited).toLocaleDateString()}
                  </p>
                )}
              </div>
              {selectedId === meeting.id && (
                <FontAwesomeIcon icon={faCheck} style={{ ...iconSize, color: color.brand.primary }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Manual URL fallback */}
      <div style={{ borderTop: `${border.width.sm} solid ${color.border.muted}`, paddingTop: space.md }}>
        <p style={{ ...bodyStyle, fontSize: font.size.body.xs, marginBottom: gap.sm }}>
          Or paste a Notion page URL directly:
        </p>
        <div style={{ display: 'flex', gap: gap.sm }}>
          <div style={{ flex: 1 }}>
            <TextInput
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://notion.so/..."
              fullWidth
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!manualUrl.trim()}
            onClick={() => {
              setSelectedId('manual');
              setLoaded(true);
              onNotesLoaded('', manualUrl.trim());
            }}
          >
            Use
          </Button>
        </div>
      </div>

      {error && (
        <p style={{
          color: color.system.yellow,
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          margin: `${gap.md} 0 0`,
        }}>
          {error}
        </p>
      )}

      {loaded && (
        <p style={{
          color: color.system.green,
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          margin: `${gap.md} 0 0`,
        }}>
          Meeting notes selected. Proceed to select services and generate.
        </p>
      )}
    </Card>
  );
}
