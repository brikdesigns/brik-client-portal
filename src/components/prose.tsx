'use client';

/**
 * Prose — shared markdown renderer with BDS token styling.
 *
 * Replaces duplicated ReactMarkdown configurations across proposal
 * components. All text rendering inside cards/collapsible sections
 * should use this component.
 *
 * USAGE:
 *   import { Prose } from '@/components/prose';
 *   <Prose content={markdownString} />
 */

import ReactMarkdown from 'react-markdown';
import { text, heading, list } from '@/lib/styles';
import { font, color, space, gap } from '@/lib/tokens';

interface ProseProps {
  content: string;
}

export function Prose({ content }: ProseProps) {
  return (
    <div style={text.body}>
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 style={{
              ...heading.section,
              margin: `${space.lg} 0 ${gap.sm}`,
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={heading.subsection}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{
              margin: `0 0 ${gap.md}`,
              lineHeight: font.lineHeight.normal,
            }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={list.ul}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{
              ...list.ul,
              listStyleType: 'decimal',
            }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={list.li}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: font.weight.semibold }}>{children}</strong>
          ),
          hr: () => (
            <hr style={{
              border: 'none',
              borderTop: `var(--_border-width---sm) solid ${color.border.muted}`,
              margin: `${space.lg} 0`,
            }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
