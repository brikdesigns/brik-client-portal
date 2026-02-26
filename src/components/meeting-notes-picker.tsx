'use client';

import { useState, useEffect } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faCheck, faSpinner, faFileLines } from '@fortawesome/free-solid-svg-icons';

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
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600 as const,
    color: 'var(--_color---text--primary)',
    margin: '0 0 8px',
  };

  const bodyStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    color: 'var(--_color---text--secondary)',
    margin: '0 0 16px',
  };

  const iconSize = { width: 14, height: 14 };

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--_color---text--muted)' }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ width: 16, height: 16, marginBottom: 8 }} />
          <p style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '14px', margin: 0 }}>
            Searching Notion for &quot;{companyName}&quot;...
          </p>
        </div>
      )}

      {!searching && meetings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => selectMeeting(meeting)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: selectedId === meeting.id
                  ? '2px solid var(--_color---brand--primary, #E35335)'
                  : 'var(--_border-width---sm) solid var(--_color---border--muted)',
                borderRadius: 'var(--_border-radius---md)',
                backgroundColor: selectedId === meeting.id
                  ? 'var(--_color---surface--secondary)'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'var(--_typography---font-family--body)',
              }}
            >
              <FontAwesomeIcon
                icon={selectedId === meeting.id ? faCheck : faFileLines}
                style={{
                  ...iconSize,
                  color: selectedId === meeting.id
                    ? 'var(--_color---brand--primary, #E35335)'
                    : 'var(--_color---text--muted)',
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--_typography---font-family--label)',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--_color---text--primary)',
                  margin: 0,
                }}>
                  {meeting.title}
                </p>
                {meeting.lastEdited && (
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--_color---text--muted)',
                    margin: '2px 0 0',
                  }}>
                    Last edited: {new Date(meeting.lastEdited).toLocaleDateString()}
                  </p>
                )}
              </div>
              {selectedId === meeting.id && (
                <FontAwesomeIcon icon={faCheck} style={{ ...iconSize, color: 'var(--_color---brand--primary, #E35335)' }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Manual URL fallback */}
      <div style={{ borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)', paddingTop: '16px' }}>
        <p style={{ ...bodyStyle, fontSize: '12px', marginBottom: '8px' }}>
          Or paste a Notion page URL directly:
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
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
          color: 'var(--system--yellow, #f2c94c)',
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '13px',
          margin: '12px 0 0',
        }}>
          {error}
        </p>
      )}

      {loaded && (
        <p style={{
          color: 'var(--system--green, #27ae60)',
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '13px',
          margin: '12px 0 0',
        }}>
          Meeting notes selected. Proceed to select services and generate.
        </p>
      )}
    </Card>
  );
}
