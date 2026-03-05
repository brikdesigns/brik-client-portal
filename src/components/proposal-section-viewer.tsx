'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Prose } from '@/components/prose';
import { label, heading } from '@/lib/styles';
import { font, color, space, gap } from '@/lib/tokens';

interface ProposalSectionViewerProps {
  title: string;
  content: string;
  sectionNumber: number;
}

export function ProposalSectionViewer({ title, content, sectionNumber }: ProposalSectionViewerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const iconSize = { width: 12, height: 12 };

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '100%', marginBottom: space.md }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <span
            style={{
              ...label.subtitle,
              fontSize: font.size.body.xs,
              color: color.text.muted,
            }}
          >
            Section {sectionNumber}
          </span>
          <span style={{ ...heading.section, margin: 0 }}>
            {title}
          </span>
        </div>
        <FontAwesomeIcon
          icon={collapsed ? faChevronDown : faChevronUp}
          style={{ ...iconSize, color: color.text.muted }}
        />
      </div>

      {!collapsed && (
        <div style={{ marginTop: space.md }}>
          <Prose content={content} />
        </div>
      )}
    </Card>
  );
}
