'use client';

import { Accordion, type AccordionItemData } from '@bds/components/ui/Accordion/Accordion';
import { ServiceBadge } from '@/components/service-badge';
import type { ScopeItem } from '@/lib/proposal-types';

interface ScopeOfProjectContentProps {
  items: ScopeItem[];
}

const listStyles = {
  margin: '0 0 12px',
  paddingLeft: '24px',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: 'var(--_typography---body--md-base)',
  lineHeight: 'var(--font-line-height--150)',
  color: 'var(--_color---text--secondary)',
} as const;

const subHeadingStyles = {
  fontFamily: 'var(--_typography---font-family--label)',
  fontSize: 'var(--_typography---label--sm)',
  fontWeight: 600 as const,
  color: 'var(--_color---text--primary)',
  margin: '0 0 8px',
} as const;

const timelineStyles = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: 'var(--_typography---body--sm)',
  color: 'var(--_color---text--muted)',
  margin: '0 0 16px',
} as const;

function ScopeItemContent({ item }: { item: ScopeItem }) {
  return (
    <div>
      {item.timeline && (
        <p style={timelineStyles}>Timeline: {item.timeline}</p>
      )}

      {item.included.length > 0 && (
        <>
          <p style={subHeadingStyles}>What&apos;s included</p>
          <ul style={listStyles}>
            {item.included.map((text, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{text}</li>
            ))}
          </ul>
        </>
      )}

      {item.not_included.length > 0 && (
        <>
          <p style={subHeadingStyles}>What&apos;s not included</p>
          <ul style={{ ...listStyles, color: 'var(--_color---text--muted)' }}>
            {item.not_included.map((text, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{text}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ScopeItemTitle({ item }: { item: ScopeItem }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--_space---gap--md)' }}>
      <ServiceBadge category={item.category_slug} serviceName={item.service_name} size={28} />
      <span>{item.service_name}</span>
    </span>
  );
}

export function ScopeOfProjectContent({ items }: ScopeOfProjectContentProps) {
  if (!items.length) {
    return (
      <p style={{
        fontFamily: 'var(--_typography---font-family--body)',
        fontSize: 'var(--_typography---body--md-base)',
        color: 'var(--_color---text--muted)',
        margin: 0,
      }}>
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
