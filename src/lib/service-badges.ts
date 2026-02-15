/**
 * Service badge SVG lookup utility.
 *
 * Maps service slugs to their badge SVG files in /public/badges/services/.
 * Badge SVGs are 20×20 with category-colored backgrounds and FA6-style icons.
 *
 * Structure: /badges/services/{category-slug}/{badge-filename}.svg
 *
 * When a service doesn't have a dedicated badge, falls back to the
 * category-level badge (e.g., brand-design.svg for Brand Design category).
 */

/** Map service slug → badge filename (without extension) */
const serviceBadgeMap: Record<string, string> = {
  // ── Brand Design ──────────────────────────────────────────
  'brand-identity-package': 'brand/brand-design',
  'logo-design': 'brand/brand-logo',
  'brand-guidelines-document': 'brand/brand-guidelines',
  'business-cards': 'brand/brand-business-card',
  'email-signature': 'brand/brand-email-signature',
  'brand-stationery': 'brand/brand-stationary',
  'brand-listings': 'brand/brand-listings',

  // ── Marketing Design ──────────────────────────────────────
  'social-media-management': 'marketing/marketing-social-graphics',
  'email-campaign-design': 'marketing/marketing-email',
  'landing-page-design': 'marketing/marketing-landing-pages',
  'marketing-consulting': 'marketing/marketing-consulting',
  'marketing-swag': 'marketing/marketing-swag',
  'website-experience': 'marketing/website-experience',
  'patient-experience': 'marketing/patient-experience',

  // ── Information Design ────────────────────────────────────
  'website-design-development': 'information/info-digital-design',
  'website-design--development': 'information/info-digital-design',
  'website-maintenance': 'information/information-design',
  'infographics': 'information/info-infographics',
  'print-design': 'information/info-print-design',
  'layout-design': 'information/info-layout-design',
  'intake-forms': 'information/info-intake-form',
  'sales-materials': 'information/info-sales-materials',
  'signage': 'information/info-signage',
  'welcome-kit': 'information/info-welcome-kit',

  // ── Product Design ────────────────────────────────────────
  'uiux-design': 'product/product-design',
  'design-system': 'product/product-design-systems',
  'app-design': 'product/product-app-design',
  'content-design': 'product/product-content-design',
  'enterprise-design': 'product/product-enterprise-design',

  // ── Service Design (Back Office) ──────────────────────────
  'process-mapping': 'service/back-office-journey-mapping',
  'consulting': 'service/back-office-consulting',
  'crm-data': 'service/back-office-crm-data',
  'software-audit': 'service/back-office-software-audit',
  'sop-creation': 'service/back-office-sop-creation',
  'automation-ai': 'service/back-office-automation-ai',
  'automated-workflow': 'service/back-office-automated-workflow',
  'customer-support': 'service/back-office-customer-support',
  'digital-file-organization': 'service/back-office-digital-file-organization',
  'training-setup': 'service/back-office-training-setup',
  'business-solutions': 'service/back-office-business-solutions',
};

/** Category-level fallback badges */
const categoryFallbackMap: Record<string, string> = {
  brand: 'brand/brand-design',
  marketing: 'marketing/marketing-design',
  information: 'information/information-design',
  product: 'product/product-design',
  service: 'service/back-office-design',
};

/**
 * Get the badge SVG path for a service.
 *
 * @param serviceSlug - The service's URL slug (e.g., "brand-identity-package")
 * @param categorySlug - Optional category slug for fallback (e.g., "brand")
 * @returns Path to the SVG relative to public/ (e.g., "/badges/services/brand/brand-design.svg")
 */
export function getServiceBadgePath(
  serviceSlug: string,
  categorySlug?: string
): string {
  const mapped = serviceBadgeMap[serviceSlug];
  if (mapped) {
    return `/badges/services/${mapped}.svg`;
  }

  if (categorySlug && categoryFallbackMap[categorySlug]) {
    return `/badges/services/${categoryFallbackMap[categorySlug]}.svg`;
  }

  // Ultimate fallback — brand design badge
  return '/badges/services/brand/brand-design.svg';
}

/**
 * Check if a service has a dedicated badge (vs category fallback).
 */
export function hasServiceBadge(serviceSlug: string): boolean {
  return serviceSlug in serviceBadgeMap;
}
