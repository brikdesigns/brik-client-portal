'use client';

import ReactMarkdown from 'react-markdown';
import { CollapsibleCard } from '@bds/components/ui/CollapsibleCard/CollapsibleCard';
import { font, color, space, border } from '@/lib/tokens';

interface AgreementSection {
  id: string;
  sectionLabel?: string;
  title: string;
  content: string;
}

/**
 * Parse markdown content_snapshot into sections by splitting on ## headings.
 * Returns preamble (before first ##) and an array of sections.
 */
function parseAgreementSections(markdown: string): {
  preamble: string;
  sections: AgreementSection[];
} {
  const lines = markdown.split('\n');
  let preamble = '';
  const sections: AgreementSection[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      // Flush previous section
      if (currentSection) {
        sections.push({
          id: `section-${sections.length}`,
          sectionLabel: `Section ${String(sections.length + 1).padStart(2, '0')}`,
          title: currentSection.title,
          content: currentSection.lines.join('\n').trim(),
        });
      }
      currentSection = { title: h2Match[1].trim(), lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      preamble += line + '\n';
    }
  }

  // Flush last section
  if (currentSection) {
    sections.push({
      id: `section-${sections.length}`,
      sectionLabel: `Section ${String(sections.length + 1).padStart(2, '0')}`,
      title: currentSection.title,
      content: currentSection.lines.join('\n').trim(),
    });
  }

  return { preamble: preamble.trim(), sections };
}

const proseStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  lineHeight: font.lineHeight.relaxed,
  color: color.text.primary,
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div style={proseStyle}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.semibold, color: color.text.primary, margin: `0 0 ${space.md}` }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontFamily: font.family.heading, fontSize: font.size.heading.small, fontWeight: font.weight.semibold, color: color.text.primary, margin: `${space.lg} 0 ${space.sm}` }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontFamily: font.family.heading, fontSize: font.size.heading.tiny, fontWeight: font.weight.semibold, color: color.text.primary, margin: `${space.md} 0 ${space.tiny}` }}>{children}</h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: `0 0 ${space.sm}`, lineHeight: font.lineHeight.relaxed, color: color.text.primary }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: font.weight.semibold }}>{children}</strong>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, listStyleType: 'disc' }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, listStyleType: 'decimal' }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '4px', lineHeight: font.lineHeight.normal, color: color.text.primary }}>{children}</li>
          ),
          hr: () => (
            <hr style={{ border: 'none', borderTop: `${border.width.sm} solid ${color.border.muted}`, margin: `${space.lg} 0` }} />
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: space.md }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ textAlign: 'left', padding: `${space.tiny} ${space.sm}`, borderBottom: `${border.width.md} solid ${color.border.muted}`, fontWeight: font.weight.semibold, fontSize: font.size.body.sm, color: color.text.muted }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ padding: `${space.tiny} ${space.sm}`, borderBottom: `${border.width.sm} solid ${color.border.muted}` }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface AgreementContentProps {
  contentSnapshot: string;
}

/**
 * Renders agreement content_snapshot as collapsible sections.
 * Parses markdown by ## headings into CollapsibleCard sections,
 * similar to how the proposal page presents content.
 */
export function AgreementContent({ contentSnapshot }: AgreementContentProps) {
  const { preamble, sections } = parseAgreementSections(contentSnapshot);

  // If no sections found, render as a single markdown block
  if (sections.length === 0) {
    return <MarkdownBlock content={contentSnapshot} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
      {/* Preamble — always visible */}
      {preamble && (
        <div style={{ marginBottom: space.sm }}>
          <MarkdownBlock content={preamble} />
        </div>
      )}

      {/* Collapsible sections */}
      {sections.map((section, index) => (
        <CollapsibleCard
          key={section.id}
          sectionLabel={section.sectionLabel}
          title={section.title}
          defaultOpen={index === 0}
        >
          <MarkdownBlock content={section.content} />
        </CollapsibleCard>
      ))}
    </div>
  );
}
