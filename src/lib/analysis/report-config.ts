/**
 * Report type definitions, categories, max scores, and industry mapping.
 *
 * Each report type has a set of category templates — these become report_items
 * when a report set is created.
 */

export type ReportType =
  | 'online_reviews'
  | 'website'
  | 'brand_logo'
  | 'competitors'
  | 'patient'
  | 'patient_comms'
  | 'guest'
  | 'guest_comms';

export type Industry = 'dental' | 'real-estate' | null;

export interface CategoryTemplate {
  category: string;
  maxScore: number;
}

export interface ReportTypeConfig {
  type: ReportType;
  label: string;
  categories: CategoryTemplate[];
}

// ── Report type configs ────────────────────────────────────────────

export const ONLINE_REVIEWS_CONFIG: ReportTypeConfig = {
  type: 'online_reviews',
  label: 'Online Reviews Audit',
  categories: [
    { category: 'Google', maxScore: 5 },
    { category: 'Facebook', maxScore: 5 },
    { category: 'Yelp', maxScore: 5 },
  ],
};

export const ONLINE_REVIEWS_DENTAL_CONFIG: ReportTypeConfig = {
  type: 'online_reviews',
  label: 'Online Reviews Audit',
  categories: [
    { category: 'Google', maxScore: 5 },
    { category: 'Healthgrades', maxScore: 5 },
    { category: 'WebMD', maxScore: 5 },
    { category: 'Yelp', maxScore: 5 },
    { category: 'Facebook', maxScore: 5 },
  ],
};

export const ONLINE_REVIEWS_REALESTATE_CONFIG: ReportTypeConfig = {
  type: 'online_reviews',
  label: 'Online Reviews Audit',
  categories: [
    { category: 'Google', maxScore: 5 },
    { category: 'Zillow', maxScore: 5 },
    { category: 'Realtor.com', maxScore: 5 },
    { category: 'Facebook', maxScore: 5 },
  ],
};

export const WEBSITE_CONFIG: ReportTypeConfig = {
  type: 'website',
  label: 'Website Report',
  categories: [
    { category: 'SSL Certificate', maxScore: 1 },
    { category: 'Mobile Responsive', maxScore: 1 },
    { category: 'Page Speed', maxScore: 1 },
    { category: 'SEO Meta Tags', maxScore: 1 },
    { category: 'Open Graph Tags', maxScore: 1 },
    { category: 'Contact Information', maxScore: 1 },
    { category: 'Social Media Links', maxScore: 1 },
  ],
};

export const BRAND_LOGO_CONFIG: ReportTypeConfig = {
  type: 'brand_logo',
  label: 'Brand/Logo Analysis',
  categories: [
    { category: 'Logo Quality', maxScore: 5 },
    { category: 'Typography', maxScore: 5 },
    { category: 'Color Palette', maxScore: 5 },
    { category: 'Brand Consistency', maxScore: 5 },
    { category: 'Social Media Branding', maxScore: 5 },
    { category: 'Print Materials', maxScore: 5 },
  ],
};

export const COMPETITORS_CONFIG: ReportTypeConfig = {
  type: 'competitors',
  label: 'Competitor Analysis',
  categories: [
    { category: 'Competitor 1', maxScore: 5 },
    { category: 'Competitor 2', maxScore: 5 },
    { category: 'Competitor 3', maxScore: 5 },
  ],
};

export const PATIENT_CONFIG: ReportTypeConfig = {
  type: 'patient',
  label: 'Patient Retention',
  categories: [
    { category: 'New Patient Rate', maxScore: 5 },
    { category: 'Retention Rate', maxScore: 5 },
    { category: 'Recall Compliance', maxScore: 5 },
    { category: 'Treatment Acceptance', maxScore: 5 },
    { category: 'No-Show Rate', maxScore: 5 },
  ],
};

export const PATIENT_COMMS_CONFIG: ReportTypeConfig = {
  type: 'patient_comms',
  label: 'Patient Communications',
  categories: [
    { category: 'Email Campaigns', maxScore: 5 },
    { category: 'Appointment Reminders', maxScore: 5 },
    { category: 'Recall Notifications', maxScore: 5 },
    { category: 'Review Requests', maxScore: 5 },
  ],
};

export const GUEST_CONFIG: ReportTypeConfig = {
  type: 'guest',
  label: 'Guest Experience',
  categories: [
    { category: 'Listing Quality', maxScore: 5 },
    { category: 'Response Time', maxScore: 5 },
    { category: 'Guest Satisfaction', maxScore: 5 },
    { category: 'Occupancy Rate', maxScore: 5 },
    { category: 'Revenue per Unit', maxScore: 5 },
  ],
};

export const GUEST_COMMS_CONFIG: ReportTypeConfig = {
  type: 'guest_comms',
  label: 'Guest Communications',
  categories: [
    { category: 'Marketing Automation', maxScore: 5 },
    { category: 'Booking Confirmations', maxScore: 5 },
    { category: 'Follow-up Sequences', maxScore: 5 },
    { category: 'Review Requests', maxScore: 5 },
  ],
};

// ── Industry → report types ────────────────────────────────────────

export function getReportConfigs(industry: Industry): ReportTypeConfig[] {
  switch (industry) {
    case 'dental':
      return [
        ONLINE_REVIEWS_DENTAL_CONFIG,
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
        PATIENT_CONFIG,
        PATIENT_COMMS_CONFIG,
      ];
    case 'real-estate':
      return [
        ONLINE_REVIEWS_REALESTATE_CONFIG,
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
        GUEST_CONFIG,
        GUEST_COMMS_CONFIG,
      ];
    default:
      return [
        ONLINE_REVIEWS_CONFIG,
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
      ];
  }
}

// ── Helpers ────────────────────────────────────────────────────────

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  online_reviews: 'Online Reviews Audit',
  website: 'Website Report',
  brand_logo: 'Brand/Logo Analysis',
  competitors: 'Competitor Analysis',
  patient: 'Patient Retention',
  patient_comms: 'Patient Communications',
  guest: 'Guest Experience',
  guest_comms: 'Guest Communications',
};
