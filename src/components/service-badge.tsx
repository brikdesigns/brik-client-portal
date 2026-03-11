'use client';

import { useState } from 'react';
import { font, gap } from '@/lib/tokens';

interface ServiceBadgeProps {
  category: string; // slug: brand, marketing, information, product, service
  serviceName?: string; // optional service name for SVG icon
  size?: number;
}

const categoryConfig: Record<string, { token: string; label: string }> = {
  brand: { token: 'yellow', label: 'Brand' },
  marketing: { token: 'green', label: 'Marketing' },
  information: { token: 'blue', label: 'Information' },
  product: { token: 'purple', label: 'Product' },
  service: { token: 'orange', label: 'Service' },
};

/**
 * Manual mapping for services that don't have exact filename matches
 * Format: "Service Name" -> "icon-filename-without-extension"
 *
 * Tiered services (Basic, Mid-Range, High-End, etc.) are auto-stripped
 * to their base name before checking this map — no need to add each tier.
 */
const serviceIconOverrides: Record<string, string> = {
  // Generic category services (named after the category itself)
  'Brand Design': 'brand-design',
  'Marketing Design': 'marketing-design',
  'Information Design': 'information-design',
  'Product Design': 'product-design',
  'Back Office Design': 'back-office-design',

  // Brand services
  'Brand Identity Bundle': 'brand-design',
  'Logo Update': 'brand-logo',
  'Premium Logo Design': 'brand-logo',
  'Standard Logo Design': 'brand-logo',
  'Brand Listings': 'brand-listings',
  'Brand Guidelines': 'brand-guidelines',
  'Business Card Design': 'brand-business-card',
  'Email Signature Design': 'brand-email-signature',
  'Stationery Design': 'brand-stationary',

  // Marketing services
  'Comprehensive Marketing Audit & Consultation': 'marketing-consulting',
  'Custom Large E-Commerce Web Development and Design': 'marketing-web-design',
  'Custom Large Web Development and Design': 'marketing-web-design',
  'Custom Standard E-Commerce Web Development and Design': 'marketing-web-design',
  'Custom Standard Web Development and Design': 'marketing-web-design',
  'Email Drip Campaign (Up to 6 Emails)': 'marketing-email',
  'Email Signature Design (Marketing)': 'marketing-email-signature',
  'Landing Pages': 'marketing-landing-pages',
  'Patient Experience Mapping': 'patient-experience',
  'Social Media Graphic Designs': 'marketing-social-graphics',
  'Swag and Merchandise Design': 'marketing-swag',
  'Website Experience Mapping': 'website-experience',
  'Website Maintenance': 'marketing-web-design',
  'SEO Optimization': 'marketing-consulting',
  'Google Business Profile Management': 'marketing-consulting',
  'Social Media Management': 'marketing-social-graphics',

  // Information services
  'Digital Design': 'info-digital-design',
  'Infographics': 'info-infographics',
  'Intake Form Design': 'info-intake-form',
  'Layout Design': 'info-layout-design',
  'Print Design': 'info-print-design',
  'Sales Materials': 'info-sales-materials',
  'Signage Design': 'info-signage',
  'Welcome Kit': 'info-welcome-kit',

  // Product services
  'App Design': 'product-app-design',
  'Content Design': 'product-content-design',
  'Design Systems': 'product-design-systems',
  'Enterprise Design': 'product-enterprise-design',

  // Service (Back Office) category mappings
  'Automated Workflow and AI Integration': 'back-office-automation-ai',
  'Back Office Support': 'back-office-business-solutions',
  'CRM Setup and Data Cleanup': 'back-office-crm-data',
  'Customer Journey Mapping': 'back-office-journey-mapping',
  'Customer Support': 'back-office-customer-support',
  'Digital File Organization': 'back-office-digital-file-organization',
  'Software and Subscription Audit': 'back-office-audit',
  'Software Automation Setup': 'back-office-automated-workflow',
  'Standard Operating Procedures (SOP) Creation': 'back-office-sop-creation',
  'Training Setup & Organization': 'back-office-training-setup',
};

/**
 * Strip tier/pricing suffixes from service names for icon lookup
 * e.g., "Automated Workflow and AI Integration (Basic)" → "Automated Workflow and AI Integration"
 */
function stripTierSuffix(name: string): string {
  return name
    .replace(/\s*\((?:Basic|Mid-Range|High-End|Standard|Premium|Essential|Pro|Enterprise|Starter|Up to \d+[^)]*)\)\s*$/i, '')
    .trim();
}

/**
 * SVG filename prefix per category — matches actual file naming convention
 * Most categories use their own name, but "service" category uses "back-office-"
 */
const categoryFilePrefix: Record<string, string> = {
  brand: 'brand',
  marketing: 'marketing',
  information: 'info',
  product: 'product',
  service: 'back-office',
};

/**
 * Normalize service name to match SVG filename convention
 * Examples:
 * - "Brand Design" -> "brand-design"
 * - "Marketing Web Design" -> "marketing-web-design"
 * - "Back Office Audit" -> "back-office-audit"
 */
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Get SVG path for a service
 * Pattern: /badges/services/{category}/{prefix}-{name}.svg
 *
 * 1. Check manual overrides (exact name, then with tier suffix stripped)
 * 2. Fallback: category-appropriate prefix + normalized name
 */
function getServiceIconPath(category: string, serviceName: string): string {
  // Check exact override first
  if (serviceIconOverrides[serviceName]) {
    return `/badges/services/${category}/${serviceIconOverrides[serviceName]}.svg`;
  }

  // Strip tier suffix and try override again
  const baseName = stripTierSuffix(serviceName);
  if (baseName !== serviceName && serviceIconOverrides[baseName]) {
    return `/badges/services/${category}/${serviceIconOverrides[baseName]}.svg`;
  }

  // Fallback: use category-appropriate prefix + normalized base name
  const prefix = categoryFilePrefix[category] ?? category;
  const normalized = normalizeServiceName(baseName);
  // Remove the category name OR prefix from normalized to avoid duplication
  // e.g., "information-design" → strip "information-" → "design" → "info-design"
  // e.g., "marketing-web-design" → strip "marketing-" → "web-design" → "marketing-web-design"
  const stripped = normalized
    .replace(new RegExp(`^${category}-`), '')
    .replace(new RegExp(`^${prefix}-`), '');

  return `/badges/services/${category}/${prefix}-${stripped}.svg`;
}

export function ServiceBadge({ category, serviceName, size = 28 }: ServiceBadgeProps) {
  const config = categoryConfig[category] ?? { token: 'orange', label: category };
  const [imageError, setImageError] = useState(false);

  // If serviceName provided and image hasn't errored, try to render SVG icon
  if (serviceName && !imageError) {
    const iconPath = getServiceIconPath(category, serviceName);

    return (
      <div
        title={serviceName}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconPath}
          alt={serviceName}
          width={size}
          height={size}
          style={{ objectFit: 'contain', display: 'block' }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback: colored square (for category badges without specific service or failed image)
  return (
    <div
      title={serviceName || config.label}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        backgroundColor: `var(--services--${config.token})`,
        flexShrink: 0,
      }}
    />
  );
}

export function ServiceCategoryLabel({ category }: { category: string }) {
  const config = categoryConfig[category] ?? { token: 'orange', label: category };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
      <ServiceBadge category={category} size={12} />
      <span
        style={{
          fontFamily: font.family.label,
          fontSize: font.size.body.xs,
          fontWeight: font.weight.medium,
          color: `var(--services--${config.token}-dark)`,
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
