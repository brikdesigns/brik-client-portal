/**
 * Report type definitions, categories, max scores, and industry mapping.
 *
 * Categories and scoring scales are aligned with the existing Notion databases
 * used in the manual marketing analysis workflow. Each report type's categories
 * match the exact property values from Notion.
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
  /** Default metadata to pre-populate on new items */
  defaultMetadata?: Record<string, unknown>;
}

export interface ReportTypeConfig {
  type: ReportType;
  label: string;
  categories: CategoryTemplate[];
}

/** Column definition for the editable report table */
export interface ColumnConfig {
  key: string;
  header: string;
  /** Which report_items column or metadata field this maps to */
  field: string;
  /** Whether this is a metadata sub-field */
  isMetadata?: boolean;
  /** Input type for editing */
  inputType: 'text' | 'number' | 'select' | 'textarea';
  /** For number inputs */
  min?: number;
  max?: number;
  step?: number;
  /** For select inputs */
  options?: Array<{ label: string; value: string }>;
  /** Read-only in edit mode (e.g. category name) */
  readOnly?: boolean;
  /** Column width hint */
  width?: string;
}

// ── Status options (shared across all report types) ──────────────

const STATUS_OPTIONS = [
  { label: 'Pass', value: 'pass' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
  { label: 'Neutral', value: 'neutral' },
];

// ── Online Reviews / Listings ────────────────────────────────────
// Notion DB: "Online Listings & Reviews" — one row per platform
// Score: 1 (listed) or 0 (not listed), Rating + Total Reviews as data

const ONLINE_REVIEWS_PLATFORMS_DENTAL = [
  'Google', 'Healthgrades', 'WebMD', 'Vitals', 'Yelp',
  'Facebook', 'Apple Maps',
];

const ONLINE_REVIEWS_PLATFORMS_REALESTATE = [
  'Google', 'Zillow', 'Realtor.com', 'TripAdvisor',
  'Airbnb', 'Vrbo', 'Facebook', 'Booking.com',
];

const ONLINE_REVIEWS_PLATFORMS_DEFAULT = [
  'Google', 'Yelp', 'Facebook', 'Apple Maps',
];

function makeOnlineReviewsConfig(platforms: string[]): ReportTypeConfig {
  return {
    type: 'online_reviews',
    label: 'Online Listings & Reviews',
    categories: platforms.map((platform) => ({
      category: platform,
      maxScore: 1,
      defaultMetadata: {
        name_on_listing: '',
        phone_listed: '',
        address_listed: '',
      },
    })),
  };
}

// ── Website Report ───────────────────────────────────────────────
// Notion DB: "Website Report" — 10 fixed categories, scored 1-5 each (50 total)

export const WEBSITE_CONFIG: ReportTypeConfig = {
  type: 'website',
  label: 'Website Report',
  categories: [
    { category: 'Overall Design', maxScore: 5 },
    { category: 'Mobile Responsiveness', maxScore: 5 },
    { category: 'Navigation', maxScore: 5 },
    { category: 'Content Clarity', maxScore: 5 },
    { category: 'Booking/Inquiries', maxScore: 5 },
    { category: 'Photos & Media', maxScore: 5 },
    { category: 'SEO Optimization', maxScore: 5 },
    { category: 'Speed & Performance', maxScore: 5 },
    { category: 'Branding Consistency', maxScore: 5 },
    { category: 'Trust Signals', maxScore: 5 },
  ],
};

// ── Brand/Logo Report ────────────────────────────────────────────
// Notion DB: "Brand/Logo Report" — 10 fixed categories, scored 1-5 each (50 total)

export const BRAND_LOGO_CONFIG: ReportTypeConfig = {
  type: 'brand_logo',
  label: 'Brand/Logo Report',
  categories: [
    { category: 'Logo Usage', maxScore: 5 },
    { category: 'Logo Consistency', maxScore: 5 },
    { category: 'Logo Legibility', maxScore: 5 },
    { category: 'Color Palette', maxScore: 5 },
    { category: 'Typography', maxScore: 5 },
    { category: 'Photography & Imagery', maxScore: 5 },
    { category: 'Brand Voice & Messaging', maxScore: 5 },
    { category: 'Social Media Branding', maxScore: 5 },
    { category: 'Signage & Onsite Branding', maxScore: 5 },
    { category: 'Overall Brand Cohesion', maxScore: 5 },
  ],
};

// ── Competitors Analysis ─────────────────────────────────────────
// Notion DB: "Competitors Analysis" — one row per competitor, variable count
// Two scores per competitor: Website Score (/50), Listings Score (/7)

export const COMPETITORS_CONFIG: ReportTypeConfig = {
  type: 'competitors',
  label: 'Competitor Analysis',
  categories: [
    { category: 'Competitor 1', maxScore: 1, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
    { category: 'Competitor 2', maxScore: 1, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
    { category: 'Competitor 3', maxScore: 1, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
  ],
};

// ── Patient Retention (dental) ───────────────────────────────────
// Notion DB: "Patient Report" — operational metrics vs industry standards

export const PATIENT_CONFIG: ReportTypeConfig = {
  type: 'patient',
  label: 'Patient Retention',
  categories: [
    { category: 'New Patients per Month', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Patient Retention Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Recall Compliance', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Treatment Acceptance Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'No-Show Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Cancellation Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Average Production per Visit', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Active Patient Count', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Lost Patients', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Referral Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
  ],
};

// ── Patient Communications (dental) ──────────────────────────────
// Notion DB: "Patient Communications Report"

export const PATIENT_COMMS_CONFIG: ReportTypeConfig = {
  type: 'patient_comms',
  label: 'Patient Communications',
  categories: [
    { category: 'Email Campaigns', maxScore: 5 },
    { category: 'Appointment Reminders', maxScore: 5 },
    { category: 'Recall Notifications', maxScore: 5 },
    { category: 'Review Requests', maxScore: 5 },
    { category: 'Post-Treatment Follow-up', maxScore: 5 },
    { category: 'Birthday/Holiday Messages', maxScore: 5 },
    { category: 'Insurance/Billing Reminders', maxScore: 5 },
    { category: 'New Patient Welcome', maxScore: 5 },
  ],
};

// ── Guest Experience (real estate) ───────────────────────────────
// Notion DB: "Guest Report"

export const GUEST_CONFIG: ReportTypeConfig = {
  type: 'guest',
  label: 'Guest Experience',
  categories: [
    { category: 'Listing Quality', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Response Time', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Guest Satisfaction', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Occupancy Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Revenue per Unit', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Repeat Guest Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Maintenance Response', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
    { category: 'Amenity Quality', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' } },
  ],
};

// ── Guest Communications (real estate) ───────────────────────────
// Notion DB: "Guest Communications Report"

export const GUEST_COMMS_CONFIG: ReportTypeConfig = {
  type: 'guest_comms',
  label: 'Guest Communications',
  categories: [
    { category: 'Marketing Automation', maxScore: 5 },
    { category: 'Booking Confirmations', maxScore: 5 },
    { category: 'Pre-Arrival Sequences', maxScore: 5 },
    { category: 'Post-Stay Follow-up', maxScore: 5 },
    { category: 'Review Requests', maxScore: 5 },
    { category: 'Seasonal Promotions', maxScore: 5 },
    { category: 'Loyalty/Return Offers', maxScore: 5 },
    { category: 'Emergency Communications', maxScore: 5 },
  ],
};

// ── Industry → report types ──────────────────────────────────────

export function getReportConfigs(industry: Industry): ReportTypeConfig[] {
  switch (industry) {
    case 'dental':
      return [
        makeOnlineReviewsConfig(ONLINE_REVIEWS_PLATFORMS_DENTAL),
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
        PATIENT_CONFIG,
        PATIENT_COMMS_CONFIG,
      ];
    case 'real-estate':
      return [
        makeOnlineReviewsConfig(ONLINE_REVIEWS_PLATFORMS_REALESTATE),
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
        GUEST_CONFIG,
        GUEST_COMMS_CONFIG,
      ];
    default:
      return [
        makeOnlineReviewsConfig(ONLINE_REVIEWS_PLATFORMS_DEFAULT),
        WEBSITE_CONFIG,
        BRAND_LOGO_CONFIG,
        COMPETITORS_CONFIG,
      ];
  }
}

// ── Display labels ───────────────────────────────────────────────

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  online_reviews: 'Online Listings & Reviews',
  website: 'Website Report',
  brand_logo: 'Brand/Logo Report',
  competitors: 'Competitor Analysis',
  patient: 'Patient Retention',
  patient_comms: 'Patient Communications',
  guest: 'Guest Experience',
  guest_comms: 'Guest Communications',
};

// ── Column configs per report type (for editable table) ──────────

export function getColumnConfig(reportType: ReportType): ColumnConfig[] {
  const categoryCol: ColumnConfig = {
    key: 'category',
    header: 'Category',
    field: 'category',
    inputType: 'text',
    readOnly: true,
    width: '160px',
  };

  const statusCol: ColumnConfig = {
    key: 'status',
    header: 'Status',
    field: 'status',
    inputType: 'select',
    options: STATUS_OPTIONS,
    width: '120px',
  };

  const scoreCol: ColumnConfig = {
    key: 'score',
    header: 'Score',
    field: 'score',
    inputType: 'number',
    min: 0,
    max: 5,
    step: 0.1,
    width: '80px',
  };

  const feedbackCol: ColumnConfig = {
    key: 'feedback_summary',
    header: 'Opportunities',
    field: 'feedback_summary',
    inputType: 'textarea',
    width: '250px',
  };

  const notesCol: ColumnConfig = {
    key: 'notes',
    header: 'Notes',
    field: 'notes',
    inputType: 'textarea',
    width: '200px',
  };

  switch (reportType) {
    case 'online_reviews':
      return [
        categoryCol,
        statusCol,
        { key: 'rating', header: 'Rating', field: 'rating', inputType: 'number', min: 0, max: 5, step: 0.1, width: '80px' },
        { key: 'total_reviews', header: 'Reviews', field: 'total_reviews', inputType: 'number', min: 0, step: 1, width: '80px' },
        { key: 'name_on_listing', header: 'Name on Listing', field: 'name_on_listing', isMetadata: true, inputType: 'text', width: '160px' },
        { key: 'phone_listed', header: 'Phone', field: 'phone_listed', isMetadata: true, inputType: 'text', width: '120px' },
        { key: 'address_listed', header: 'Address', field: 'address_listed', isMetadata: true, inputType: 'text', width: '160px' },
        { key: 'feedback_summary', header: 'Feedback', field: 'feedback_summary', inputType: 'textarea', width: '200px' },
        notesCol,
      ];

    case 'website':
    case 'brand_logo':
      return [categoryCol, statusCol, scoreCol, feedbackCol, notesCol];

    case 'competitors':
      return [
        { ...categoryCol, header: 'Slot' },
        { key: 'competitor_name', header: 'Competitor', field: 'competitor_name', isMetadata: true, inputType: 'text', width: '160px' },
        statusCol,
        { key: 'distance', header: 'Distance', field: 'distance', isMetadata: true, inputType: 'text', width: '80px' },
        { key: 'services_offered', header: 'Services', field: 'services_offered', isMetadata: true, inputType: 'textarea', width: '160px' },
        { key: 'website_score', header: 'Website (/50)', field: 'website_score', isMetadata: true, inputType: 'number', min: 0, max: 50, step: 1, width: '100px' },
        { key: 'listings_reviews_score', header: 'Listings (/7)', field: 'listings_reviews_score', isMetadata: true, inputType: 'number', min: 0, max: 7, step: 1, width: '100px' },
        notesCol,
      ];

    case 'patient':
    case 'guest':
      return [
        categoryCol,
        statusCol,
        scoreCol,
        { key: 'metric', header: 'Metric', field: 'metric', isMetadata: true, inputType: 'text', width: '120px' },
        { key: 'industry_standard', header: 'Industry Standard', field: 'industry_standard', isMetadata: true, inputType: 'text', width: '140px' },
        notesCol,
      ];

    case 'patient_comms':
    case 'guest_comms':
      return [categoryCol, statusCol, scoreCol, notesCol];

    default:
      return [categoryCol, statusCol, scoreCol, notesCol];
  }
}
