'use client';

import { Accordion, type AccordionItemData } from '@bds/components/ui/Accordion/Accordion';
import { text, list } from '@/lib/styles';
import { color, font } from '@/lib/tokens';
import type { TimelinePhase } from '@/lib/proposal-types';

interface ProjectTimelineContentProps {
  phases: TimelinePhase[];
}

function PhaseContent({ phase }: { phase: TimelinePhase }) {
  return (
    <div>
      {phase.deliverables.length > 0 ? (
        <ul style={{ ...list.ul, margin: 0 }}>
          {phase.deliverables.map((txt, i) => (
            <li key={i} style={list.li}>{txt}</li>
          ))}
        </ul>
      ) : (
        <p style={{ ...text.body, color: color.text.muted, margin: 0 }}>
          No deliverables specified.
        </p>
      )}
    </div>
  );
}

export function ProjectTimelineContent({ phases }: ProjectTimelineContentProps) {
  if (!phases.length) {
    return (
      <p style={{ ...text.body, color: color.text.muted, margin: 0 }}>
        No timeline phases defined yet.
      </p>
    );
  }

  const accordionItems: AccordionItemData[] = phases.map((phase, index) => ({
    id: `phase-${index}`,
    title: (
      <span style={{
        fontFamily: font.family.body,
        fontSize: font.size.body.md,
        fontWeight: font.weight.medium,
      }}>
        {phase.phase_label}
      </span>
    ),
    content: <PhaseContent phase={phase} />,
  }));

  return (
    <Accordion
      items={accordionItems}
      allowMultiple
    />
  );
}
