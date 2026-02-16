'use client';

import { useState } from 'react';

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
 */
const serviceIconOverrides: Record<string, string> = {
  // Brand services
  'Brand Identity Bundle': 'brand-design',
  'Logo Update': 'brand-logo',
  'Premium Logo Design': 'brand-logo',
  'Standard Logo Design': 'brand-logo',

  // Marketing services
  'Comprehensive Marketing Audit & Consultation': 'marketing-consulting',
  'Custom Large E-Commerce Web Development and Design': 'marketing-web-design',
  'Custom Large Web Development and Design': 'marketing-web-design',
  'Custom Standard E-Commerce Web Development and Design': 'marketing-web-design',
  'Custom Standard Web Development and Design': 'marketing-web-design',
  'Email Drip Campaign (Up to 6 Emails)': 'marketing-email',
  'Landing Pages': 'marketing-landing-pages',
  'Patient Experience Mapping': 'patient-experience',
  'Social Media Graphic Designs': 'marketing-social-graphics',
  'Swag and Merchandise Design': 'marketing-swag',
  'Website Experience Mapping': 'website-experience',

  // Service (Back Office) category mappings
  'Automated Workflow and AI Integration': 'back-office-automation-ai',
  'CRM Setup and Data Cleanup': 'back-office-crm-data',
  'Customer Journey Mapping': 'back-office-journey-mapping',
  'Digital File Organization': 'back-office-digital-file-organization',
  'Software and Subscription Audit': 'back-office-audit',
  'Software Automation Setup': 'back-office-automated-workflow',
  'Standard Operating Procedures (SOP) Creation': 'back-office-business-solutions',
  'Training Setup & Organization': 'back-office-consulting',
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
 * Pattern: /badges/services/{category}/{icon-name}.svg
 *
 * 1. Check manual overrides first (for services with non-matching names)
 * 2. Try normalized service name
 * 3. For information category, try "info-" prefix
 */
function getServiceIconPath(category: string, serviceName: string): string {
  // Check if there's a manual override mapping
  if (serviceIconOverrides[serviceName]) {
    return `/badges/services/${category}/${serviceIconOverrides[serviceName]}.svg`;
  }

  const normalized = normalizeServiceName(serviceName);

  // For "information" category, try "info-" prefix first (common pattern)
  if (category === 'information') {
    return `/badges/services/${category}/info-${normalized.replace('information-', '')}.svg`;
  }

  // Standard pattern: try to match normalized name
  return `/badges/services/${category}/${category}-${normalized.replace(`${category}-`, '')}.svg`;
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
          backgroundColor: `var(--services--${config.token})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={iconPath}
          alt={serviceName}
          width={size * 0.6}
          height={size * 0.6}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ServiceBadge category={category} size={12} />
      <span
        style={{
          fontFamily: 'var(--_typography---font-family--label)',
          fontSize: '12px',
          fontWeight: 500,
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
