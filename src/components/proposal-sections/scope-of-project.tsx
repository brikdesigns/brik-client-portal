'use client';

import { Accordion, type AccordionItemData } from '@bds/components/ui/Accordion/Accordion';
import { ServiceBadge } from '@/components/service-badge';
import { text, label, list } from '@/lib/styles';
import { color, gap, space } from '@/lib/tokens';
import type { ScopeItem } from '@/lib/proposal-types';

interface ScopeOfProjectContentProps {
  items: ScopeItem[];
}

const timelineStyles = {
  ...text.bodySmall,
  color: color.text.muted,
  margin: `0 0 ${space.md}`,
} as const;

function ScopeItemContent({ item }: { item: ScopeItem }) {
  return (
    <div>
      {item.timeline && (
        <p style={timelineStyles}>Timeline: {item.timeline}</p>
      )}

      {item.included.length > 0 && (
        <>
          <p style={{ ...label.sm, margin: `0 0 ${gap.sm}` }}>What&apos;s included</p>
          <ul style={list.ul}>
            {item.included.map((txt, i) => (
              <li key={i} style={list.li}>{txt}</li>
            ))}
          </ul>
        </>
      )}

      {item.not_included.length > 0 && (
        <>
          <p style={{ ...label.sm, margin: `0 0 ${gap.sm}` }}>What&apos;s not included</p>
          <ul style={{ ...list.ul, color: color.text.muted }}>
            {item.not_included.map((txt, i) => (
              <li key={i} style={list.li}>{txt}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ScopeItemTitle({ item }: { item: ScopeItem }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
      <ServiceBadge category={item.category_slug} serviceName={item.service_name} size={28} />
      <span>{item.service_name}</span>
    </span>
  );
}

export function ScopeOfProjectContent({ items }: ScopeOfProjectContentProps) {
  if (!items.length) {
    return (
      <p style={{ ...text.body, color: color.text.muted, margin: 0 }}>
        No services added to scope yet.
      </p>
    );
  }

  const accordionItems: AccordionItemData[] = items.map((item, index) => ({
    id: item.service_id || `scope-${index}`,
    title: <ScopeItemTitle item={item} />,
    content: <ScopeItemContent item={item} />,
  }));

  return (
    <Accordion
      items={accordionItems}
      allowMultiple
    />
  );
}
