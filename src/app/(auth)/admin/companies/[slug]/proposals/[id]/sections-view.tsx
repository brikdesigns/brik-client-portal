'use client';

import { Accordion, type AccordionItemData } from '@bds/components/ui/Accordion/Accordion';
import { AlertBanner } from '@bds/components/ui/AlertBanner/AlertBanner';
import { Button } from '@bds/components/ui/Button/Button';
import {
  ScopeOfProjectContent,
  ProjectTimelineContent,
  FeeSummaryContent,
  MarkdownContent,
} from '@/components/proposal-sections';
import { text } from '@/lib/styles';
import { color, space } from '@/lib/tokens';
import {
  isScopeSection,
  isTimelineSection,
  isFeeSummarySection,
  type ProposalSectionBase,
  type ScopeOfProjectSection,
  type ProjectTimelineSection,
  type FeeSummaryItem,
} from '@/lib/proposal-types';

interface ProposalSectionsViewProps {
  sections: ProposalSectionBase[];
  feeSummaryItems: FeeSummaryItem[];
  totalAmountCents: number;
  meetingNotesUrl: string | null;
  hasSections: boolean;
}


function renderSectionContent(
  section: ProposalSectionBase,
  feeSummaryItems: FeeSummaryItem[],
  totalAmountCents: number,
) {
  if (isFeeSummarySection(section)) {
    return (
      <FeeSummaryContent
        items={feeSummaryItems}
        totalAmountCents={totalAmountCents}
      />
    );
  }

  if (isScopeSection(section)) {
    const scopeSection = section as ScopeOfProjectSection;
    if (scopeSection.scope_items && scopeSection.scope_items.length > 0) {
      return <ScopeOfProjectContent items={scopeSection.scope_items} />;
    }
  }

  if (isTimelineSection(section)) {
    const timelineSection = section as ProjectTimelineSection;
    if (timelineSection.timeline_phases && timelineSection.timeline_phases.length > 0) {
      return <ProjectTimelineContent phases={timelineSection.timeline_phases} />;
    }
  }

  // Fallback: render markdown content
  if (section.content) {
    return <MarkdownContent content={section.content} />;
  }

  return (
    <p style={{ ...text.body, color: color.text.muted, margin: 0 }}>
      No content yet.
    </p>
  );
}

export function ProposalSectionsView({
  sections,
  feeSummaryItems,
  totalAmountCents,
  meetingNotesUrl,
  hasSections,
}: ProposalSectionsViewProps) {
  if (!hasSections && feeSummaryItems.length === 0) {
    return null;
  }

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg, marginBottom: space.lg }}>
      {/* Meeting Notes alert banner */}
      {meetingNotesUrl && (
        <AlertBanner
          variant="information"
          title="Meeting Notes"
          description="Source notes used to generate this proposal"
          action={
            <a href={meetingNotesUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                View Notes
              </Button>
            </a>
          }
        />
      )}

      {/* Collapsible sections */}
      <Accordion
        allowMultiple
        items={[
          ...sortedSections.map((section, index): AccordionItemData => ({
            id: section.type,
            title: `${index + 1}. ${section.title}`,
            content: renderSectionContent(section, feeSummaryItems, totalAmountCents),
          })),
          ...(!sortedSections.some(s => s.type === 'fee_summary') && feeSummaryItems.length > 0
            ? [{
                id: 'fee_summary',
                title: `${sortedSections.length + 1}. Fee Summary`,
                content: (
                  <FeeSummaryContent
                    items={feeSummaryItems}
                    totalAmountCents={totalAmountCents}
                  />
                ),
              }]
            : []),
        ]}
      />
    </div>
  );
}
