'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

interface ProposalSectionViewerProps {
  title: string;
  content: string;
  sectionNumber: number;
}

export function ProposalSectionViewer({ title, content, sectionNumber }: ProposalSectionViewerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const iconSize = { width: 12, height: 12 };

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '100%', marginBottom: '16px' }}>
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
            Section {sectionNumber}
          </span>
          <span
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: 'var(--_typography---heading--small, 18px)',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
            }}
          >
            {title}
          </span>
        </div>
        <FontAwesomeIcon
          icon={collapsed ? faChevronDown : faChevronUp}
          style={{ ...iconSize, color: 'var(--_color---text--muted)' }}
        />
      </div>

      {!collapsed && (
        <div
          style={{
            marginTop: '16px',
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'var(--_color---text--primary)',
          }}
          className="proposal-preview"
        >
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 style={{
                  fontFamily: 'var(--_typography---font-family--heading)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--_color---text--primary)',
                  margin: '24px 0 8px',
                }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{
                  fontFamily: 'var(--_typography---font-family--heading)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--_color---text--primary)',
                  margin: '20px 0 8px',
                }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ margin: '0 0 12px', lineHeight: 1.7 }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: '24px', margin: '0 0 12px' }}>{children}</ul>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: '4px' }}>{children}</li>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600 }}>{children}</strong>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </Card>
  );
}
