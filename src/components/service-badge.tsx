'use client';

import {
  ServiceBadge as BdsServiceBadge,
  categoryConfig,
  type ServiceCategory,
} from '@bds/components/ui/ServiceBadge/ServiceBadge';
import { font, gap, serviceColor } from '@/lib/tokens';

/**
 * Thin wrapper around BDS ServiceBadge.
 *
 * Adapts portal conventions (numeric size, raw DB service names) to
 * BDS props. Strips tier suffixes and resolves service names to the
 * closest matching icon — passes undefined if no icon exists so BDS
 * renders the colored-square fallback.
 */

const sizeToVariant = (px?: number): 'sm' | 'md' | 'lg' => {
  if (!px || px <= 20) return 'sm';
  if (px <= 28) return 'md';
  return 'lg';
};

/**
 * Strip tier/pricing suffixes from service names.
 * e.g., "Automated Workflow and AI Integration (Basic)" → "Automated Workflow and AI Integration"
 */
function stripTierSuffix(name: string): string {
  return name
    .replace(/\s*\((?:Basic|Base|Mid-Range|High-End|Standard|Premium|Essential|Pro|Enterprise|Starter|Up to \d+[^)]*|\d+[^)]*)\)\s*$/i, '')
    .trim();
}

/**
 * Maps service base names → the canonical name recognized by BDS overrides.
 * This handles services whose DB names don't match BDS override keys.
 *
 * Only needed for services whose names differ from the BDS override map.
 * Tier variants are auto-stripped before checking this map.
 */
const portalNameOverrides: Record<string, string | null> = {
  // Brand
  'Business Card': 'Business Card Design',
  'Email Signature': 'Email Signature Design',
  'Letterhead Stationary': 'Stationery Design',
  'Online Business Listings': 'Brand Listings',

  // Marketing
  'Email Marketing – Ongoing Management': 'Email Drip Campaign (Up to 6 Emails)',
  'Email Marketing': 'Email Drip Campaign (Up to 6 Emails)',
  'Fractional CMO & Strategic Marketing Oversight': 'Comprehensive Marketing Audit & Consultation',
  'Marketing Support': 'Comprehensive Marketing Audit & Consultation',
  'On Demand: Builder\'s Choice': null,
  'On Demand: Starter Stack': null,
  'On-Demand: The Brikhouse': null,
  'Press Release + Distribution': null,
  'Press Release + Distribution + Media Pitching': null,
  'Social Media Graphic Bundle of 10': 'Social Media Graphic Designs',
  'Social Media Graphic Bundle of 5': 'Social Media Graphic Designs',
  'Swag & Merchandise Design Bundle': 'Swag and Merchandise Design',
  'Swag and Merchandise Design': 'Swag and Merchandise Design',
  'Templated Website Design & Development': 'Custom Standard Web Development and Design',
  'Website Maintenance': 'Custom Standard Web Development and Design',

  // Information
  'Booklet Design': 'Layout Design',
  'Brochure': 'Print Design',
  'Flyer': 'Print Design',
  'Intake Forms': 'Intake Form Design',
  'Large Signage Design': 'Signage Design',
  'One-Pager': 'Print Design',
  'Sales Pitch Deck': 'Sales Materials',
  'Sales Proposal': 'Sales Materials',
  'Sales Resources': 'Sales Materials',
  'Small Signage Design': 'Signage Design',
  'Welcome Onboarding Kit': 'Welcome Kit',

  // Product
  'Full SaaS or Enterprise Product Design': 'Enterprise Design',
  'Mobile App Design': 'App Design',

  // Service (Back Office)
  'Back Office Support': null,  // no specific icon → colored square
  'Ongoing Data Management & Reporting': 'CRM Setup and Data Cleanup',
  'Patient Experience Mapping': null,  // icon exists in marketing/ but DB has it in service/
  'Software and Subscription Audit': 'Software and Subscription Audit',
};

/**
 * Resolve a service name to one the BDS component can find an icon for.
 * Returns undefined if no icon exists (BDS will render colored square).
 */
function resolveServiceName(name: string): string | undefined {
  // 1. Strip tier suffix
  const baseName = stripTierSuffix(name);

  // 2. Check portal overrides (null = no icon available)
  if (baseName in portalNameOverrides) {
    return portalNameOverrides[baseName] ?? undefined;
  }

  // 3. Original name might have a suffix we didn't strip — check that too
  if (name in portalNameOverrides) {
    return portalNameOverrides[name] ?? undefined;
  }

  // 4. Pass through — BDS will try its own overrides + fallback path
  return baseName;
}

interface ServiceBadgeProps {
  category: string;
  serviceName?: string;
  size?: number;
}

export function ServiceBadge({ category, serviceName, size = 28 }: ServiceBadgeProps) {
  const resolved = serviceName ? resolveServiceName(serviceName) : undefined;

  return (
    <BdsServiceBadge
      category={category as ServiceCategory}
      serviceName={resolved}
      size={sizeToVariant(size)}
    />
  );
}

export function ServiceCategoryLabel({ category }: { category: string }) {
  const config = categoryConfig[category as ServiceCategory] ?? { token: 'orange', label: category };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
      <BdsServiceBadge category={category as ServiceCategory} size="sm" />
      <span
        style={{
          fontFamily: font.family.label,
          fontSize: font.size.body.xs,
          fontWeight: font.weight.medium,
          color: serviceColor(category).text,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

export { categoryConfig };
