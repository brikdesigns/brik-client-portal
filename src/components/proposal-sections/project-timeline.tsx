'use client';

import { Accordion, type AccordionItemData } from '@bds/components/ui/Accordion/Accordion';
import type { TimelinePhase } from '@/lib/proposal-types';

interface ProjectTimelineContentProps {
  phases: TimelinePhase[];
}

const listStyles = {
  margin: 0,
  paddingLeft: '24px',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: 'var(--_typography---body--md-base)',
  lineHeight: 'var(--font-line-height--150)',
  color: 'var(--_color---text--secondary)',
} as const;

function PhaseContent({ phase }: { phase: TimelinePhase }) {
  return (
    <div>
      {phase.deliverables.length > 0 ? (
        <ul style={listStyles}>
          {phase.deliverables.map((text, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>{text}</li>
          ))}
        </ul>
      ) : (
        <p style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: 'var(--_typography---body--md-base)',
          color: 'var(--_color---text--muted)',
          margin: 0,
        }}>
          No deliverables specified.
        </p>
      )}
    </div>
  );
}

export function ProjectTimelineContent({ phases }: ProjectTimelineContentProps) {
  if (!phases.length) {
    return (
      <p style={{
        fontFamily: 'var(--_typography---font-family--body)',
        fontSize: 'var(--_typography---body--md-base)',
        color: 'var(--_color---text--muted)',
        margin: 0,
      }}>
        No timeline phases defined yet.
      </p>
    );
  }

  const accordionItems: AccordionItemData[] = phases.map((phase, index) => ({
    id: `phase-${index}`,
    title: phase.phase_label,
    content: <PhaseContent phase={phase} />,
  }));

  return (
    <Accordion
      items={accordionItems}
      allowMultiple
    />
  );
}
