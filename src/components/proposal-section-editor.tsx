'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faRotateRight, faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

export interface ProposalSection {
  type: string;
  title: string;
  content: string | null;
  sort_order: number;
}

interface ProposalSectionEditorProps {
  section: ProposalSection;
  sectionIndex: number;
  onChange: (updated: ProposalSection) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function ProposalSectionEditor({
  section,
  sectionIndex,
  onChange,
  onRegenerate,
  regenerating,
}: ProposalSectionEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [preview, setPreview] = useState(false);

  const iconSize = { width: 12, height: 12 };

  const sectionLabel = `Section ${sectionIndex + 1}`;
  const isFeeSection = section.type === 'fee_summary';

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--_typography---font-family--label)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--_color---text--muted)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}
          >
            {sectionLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: 'var(--_typography---heading--small, 18px)',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
            }}
          >
            {section.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isFeeSection && !collapsed && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(!preview);
                }}
              >
                <FontAwesomeIcon icon={preview ? faEdit : faEye} style={iconSize} />
                {preview ? 'Edit' : 'Preview'}
              </Button>
              {onRegenerate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={regenerating}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerate();
                  }}
                >
                  <FontAwesomeIcon icon={faRotateRight} style={iconSize} spin={regenerating} />
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              )}
            </>
          )}
          <FontAwesomeIcon
            icon={collapsed ? faChevronDown : faChevronUp}
            style={{ ...iconSize, color: 'var(--_color---text--muted)' }}
          />
        </div>
      </div>

      {!collapsed && !isFeeSection && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <TextInput
              label="Section Title"
              type="text"
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              fullWidth
            />
          </div>

          {preview ? (
            <div
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--_color---text--primary)',
                padding: '16px',
                backgroundColor: 'var(--_color---surface--secondary)',
                borderRadius: 'var(--_border-radius---md)',
                minHeight: '200px',
              }}
              className="proposal-preview"
            >
              <ReactMarkdown>{section.content || ''}</ReactMarkdown>
            </div>
          ) : (
            <TextArea
              label="Content (Markdown)"
              value={section.content || ''}
              onChange={(e) => onChange({ ...section, content: e.target.value })}
              rows={12}
              fullWidth
            />
          )}
        </div>
      )}

      {!collapsed && isFeeSection && (
        <div style={{ marginTop: '16px' }}>
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--muted)',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Fee Summary is generated from the line items below. Edit services and pricing in the Line Items section.
          </p>
        </div>
      )}
    </Card>
  );
}
