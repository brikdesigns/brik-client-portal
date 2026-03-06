'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faRotateRight, faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { font, color, space, gap, border } from '@/lib/tokens';
import { label as labelStyle } from '@/lib/styles';

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
    <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: space.md }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
          <span
            style={{
              ...labelStyle.subtitle,
              fontSize: font.size.body.xs,
              color: color.text.muted,
            }}
          >
            {sectionLabel}
          </span>
          <span
            style={{
              fontFamily: font.family.heading,
              fontSize: font.size.heading.small,
              fontWeight: font.weight.semibold,
              color: color.text.primary,
            }}
          >
            {section.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
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
            style={{ ...iconSize, color: color.text.muted }}
          />
        </div>
      </div>

      {!collapsed && !isFeeSection && (
        <div style={{ marginTop: space.md }}>
          <div style={{ marginBottom: space.sm }}>
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
                fontFamily: font.family.body,
                fontSize: font.size.body.sm,
                lineHeight: font.lineHeight.relaxed,
                color: color.text.primary,
                padding: space.md,
                backgroundColor: color.surface.secondary,
                borderRadius: border.radius.md,
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
        <div style={{ marginTop: space.md }}>
          <p
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              color: color.text.muted,
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
