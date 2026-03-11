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

export type Industry = 'dental' | 'commercial-real-estate' | null;

export interface CategoryTemplate {
  category: string;
  maxScore: number;
  /** Default metadata to pre-populate on new items */
  defaultMetadata?: Record<string, unknown>;
  /** Scoring rubric — maps each score (1-max) to a short description */
  rubric?: Record<number, string>;
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
  { label: 'Needs Attention', value: 'warning' },
  { label: 'Fail', value: 'fail' },
  { label: 'Not Started', value: 'neutral' },
];

// ── Online Reviews / Listings ────────────────────────────────────
// Notion DB: "Online Listings & Reviews" — one row per platform
// Score: 1 (listed) or 0 (not listed), Rating + Total Reviews as data

const ONLINE_REVIEWS_PLATFORMS_DENTAL = [
  'Google', 'WebMD', 'Yelp',
  'Facebook', 'Apple Maps',
];

const ONLINE_REVIEWS_PLATFORMS_CRE = [
  'Google', 'LoopNet', 'LinkedIn', 'CREXi',
  'Facebook', 'CoStar', 'Yelp',
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
    {
      category: 'Overall Design',
      maxScore: 5,
      rubric: {
        1: 'Dated or broken layout, no modern CSS patterns',
        2: 'Basic layout, minimal use of flexbox/grid',
        3: 'Clean layout with some modern patterns (flex, custom properties)',
        4: 'Modern design with grid, animations, and responsive images',
        5: 'Exceptional — grid, flex, custom properties, animations, responsive images, dark mode',
      },
    },
    {
      category: 'Mobile Responsiveness',
      maxScore: 5,
      rubric: {
        1: 'Not responsive — fixed-width or broken on mobile',
        2: 'Partially responsive — some elements overflow or misalign',
        3: 'Responsive layout but minor usability issues on mobile',
        4: 'Fully responsive with good touch targets and readable text',
        5: 'Mobile-first design with optimized touch UX and fast load',
      },
    },
    {
      category: 'Navigation',
      maxScore: 5,
      rubric: {
        1: 'No clear nav or broken links',
        2: 'Basic nav but missing key pages or confusing structure',
        3: 'Functional nav with main pages accessible',
        4: 'Well-organized nav with logical hierarchy and mobile menu',
        5: 'Intuitive nav with breadcrumbs, search, and clear IA',
      },
    },
    {
      category: 'Content Clarity',
      maxScore: 5,
      rubric: {
        1: 'Dense, hard-to-read text (Flesch-Kincaid < 30)',
        2: 'Mediocre readability, poor heading structure',
        3: 'Readable content with some heading hierarchy (FK 50-60)',
        4: 'Clear content, good headings, CTAs present (FK 60-70)',
        5: 'Excellent readability (FK 70+), strong headings, multiple CTAs',
      },
    },
    {
      category: 'Booking/Inquiries',
      maxScore: 5,
      rubric: {
        1: 'No booking/contact mechanism found',
        2: 'Contact info exists but no online booking or form',
        3: 'Basic contact form or phone number prominently displayed',
        4: 'Online booking/scheduling with clear CTA buttons',
        5: 'Seamless booking with multiple channels (online, phone, chat)',
      },
    },
    {
      category: 'Photos & Media',
      maxScore: 5,
      rubric: {
        1: 'No images or only stock photos, broken media',
        2: 'Few images, low quality or poorly sized',
        3: 'Adequate photos but not optimized (no srcset, large files)',
        4: 'Quality photos with responsive images and good alt text',
        5: 'Professional photography, video content, optimized delivery',
      },
    },
    {
      category: 'SEO Optimization',
      maxScore: 5,
      rubric: {
        1: 'Missing title, meta description, or H1 tag',
        2: 'Basic SEO present but thin (generic title, no schema)',
        3: 'Title, meta, H1 present with some keyword usage',
        4: 'Good SEO with structured data, sitemap, canonical tags',
        5: 'Comprehensive SEO — rich schema, open graph, fast load, all meta',
      },
    },
    {
      category: 'Speed & Performance',
      maxScore: 5,
      rubric: {
        1: 'Very slow (> 8s load), major blocking resources',
        2: 'Slow (5-8s), large unoptimized assets',
        3: 'Average speed (3-5s), some optimization needed',
        4: 'Fast (1-3s), good asset optimization',
        5: 'Very fast (< 1s), CDN, lazy loading, optimized everything',
      },
    },
    {
      category: 'Branding Consistency',
      maxScore: 5,
      rubric: {
        1: 'No consistent branding across pages',
        2: 'Logo present but inconsistent fonts/colors between pages',
        3: 'Mostly consistent but some pages diverge in style',
        4: 'Consistent branding with unified fonts, colors, and logo',
        5: 'Perfect consistency — design tokens, logo on all pages, cohesive feel',
      },
    },
    {
      category: 'Trust Signals',
      maxScore: 5,
      rubric: {
        1: 'No trust signals (no reviews, credentials, or security)',
        2: 'Minimal — basic contact info only',
        3: 'Some trust signals (credentials listed, HTTPS present)',
        4: 'Good trust signals — reviews, certifications, team bios',
        5: 'Strong trust — testimonials, awards, before/after, HIPAA badge, SSL',
      },
    },
  ],
};

// ── Brand/Logo Report ────────────────────────────────────────────
// Notion DB: "Brand/Logo Report" — 10 fixed categories, scored 1-5 each (50 total)

export const BRAND_LOGO_CONFIG: ReportTypeConfig = {
  type: 'brand_logo',
  label: 'Brand/Logo Report',
  categories: [
    {
      category: 'Logo Usage',
      maxScore: 5,
      rubric: {
        1: 'No logo found on website',
        2: 'Logo present but used inconsistently or poorly placed',
        3: 'Logo in header, adequate sizing and placement',
        4: 'Logo well-placed with clear space, used in header and footer',
        5: 'Professional logo usage — consistent placement, proper sizing, favicon included',
      },
    },
    {
      category: 'Logo Consistency',
      maxScore: 5,
      rubric: {
        1: 'Different logos or no logo on internal pages',
        2: 'Logo varies in size/color across pages',
        3: 'Same logo on most pages but minor inconsistencies',
        4: 'Consistent logo across all crawled pages',
        5: 'Identical logo treatment on every page with proper alt text',
      },
    },
    {
      category: 'Logo Legibility',
      maxScore: 5,
      rubric: {
        1: 'Logo is blurry, tiny, or unreadable',
        2: 'Low resolution or poor format (pixelated raster)',
        3: 'Adequate quality but not optimized for retina',
        4: 'Good quality with retina support or SVG format',
        5: 'SVG or high-DPI logo, favicon and touch icons present',
      },
    },
    {
      category: 'Color Palette',
      maxScore: 5,
      rubric: {
        1: 'No identifiable color palette or clashing colors',
        2: 'Limited palette, some inconsistent color usage',
        3: 'Identifiable brand colors used on homepage',
        4: 'Consistent palette with CSS custom properties or variables',
        5: 'Well-defined palette with design tokens, consistent across all pages',
      },
    },
    {
      category: 'Typography',
      maxScore: 5,
      rubric: {
        1: 'Default browser fonts or inconsistent type treatment',
        2: 'Custom fonts loaded but inconsistent usage',
        3: 'Consistent heading and body fonts on homepage',
        4: 'Clear typographic hierarchy with 2-3 font weights',
        5: 'Professional type system — clear hierarchy, proper scale, consistent across pages',
      },
    },
    {
      category: 'Photography & Imagery',
      maxScore: 5,
      rubric: {
        1: 'No images or all generic stock photos',
        2: 'Mix of stock and original, inconsistent style',
        3: 'Adequate imagery with some brand relevance',
        4: 'Quality photos that match brand tone and color palette',
        5: 'Professional, cohesive imagery throughout — custom photography, consistent editing',
      },
    },
    {
      category: 'Brand Voice & Messaging',
      maxScore: 5,
      rubric: {
        1: 'Generic or no clear brand messaging',
        2: 'Some messaging but inconsistent tone',
        3: 'Identifiable voice with mission-oriented content',
        4: 'Strong voice with second-person engagement, UVP present',
        5: 'Compelling, consistent brand voice — clear UVP, personal tone, readable (FK 60+)',
      },
    },
    {
      category: 'Social Media Branding',
      maxScore: 5,
      rubric: {
        1: 'No social media links found on website',
        2: 'Social links present but profiles look inactive or unbranded',
        3: 'Active social profiles linked from website',
        4: 'Branded social profiles with consistent visual identity',
        5: 'Active, branded profiles with engagement and content aligned to brand',
      },
    },
    {
      category: 'Signage & Onsite Branding',
      maxScore: 5,
      rubric: {
        1: 'No evidence of physical branding (signage, office photos)',
        2: 'Basic signage visible but not branded consistently',
        3: 'Branded signage shown in some photos or virtual tour',
        4: 'Consistent onsite branding visible in photos/tours',
        5: 'Professional onsite branding — signage, interiors, uniforms all cohesive',
      },
    },
    {
      category: 'Overall Brand Cohesion',
      maxScore: 5,
      rubric: {
        1: 'No cohesive brand identity — fragmented presence',
        2: 'Some brand elements but major inconsistencies',
        3: 'Recognizable brand with room for improvement',
        4: 'Strong brand cohesion across web and social presence',
        5: 'Exceptional brand cohesion — all touchpoints reinforce a unified identity',
      },
    },
  ],
};

// ── Competitors Analysis ─────────────────────────────────────────
// Notion DB: "Competitors Analysis" — one row per competitor, variable count
// Two scores per competitor: Website Score (/50), Listings Score (/5)

export const COMPETITORS_CONFIG: ReportTypeConfig = {
  type: 'competitors',
  label: 'Competitor Analysis',
  categories: [
    { category: 'Competitor 1', maxScore: 55, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
    { category: 'Competitor 2', maxScore: 55, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
    { category: 'Competitor 3', maxScore: 55, defaultMetadata: { competitor_name: '', distance: '', services_offered: '', website_score: null, website_score_explanation: '', listings_reviews_score: null, listings_review_score_explanation: '' } },
  ],
};

// ── Patient Retention (dental) ───────────────────────────────────
// Notion DB: "Patient Report" — operational metrics vs industry standards

export const PATIENT_CONFIG: ReportTypeConfig = {
  type: 'patient',
  label: 'Patient Retention',
  categories: [
    { category: 'New Patients per Month', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 10 new patients/month', 2: '10-19 new patients/month', 3: '20-29 new patients/month (industry avg)', 4: '30-49 new patients/month', 5: '50+ new patients/month' } },
    { category: 'Patient Retention Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 60% retention', 2: '60-69% retention', 3: '70-79% retention', 4: '80-89% retention (industry avg ~85%)', 5: '90%+ retention' } },
    { category: 'Recall Compliance', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 40% compliance', 2: '40-54% compliance', 3: '55-69% compliance', 4: '70-84% compliance (industry avg ~75%)', 5: '85%+ compliance' } },
    { category: 'Treatment Acceptance Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 50% acceptance', 2: '50-59% acceptance', 3: '60-69% acceptance', 4: '70-79% acceptance (industry avg ~70%)', 5: '80%+ acceptance' } },
    { category: 'No-Show Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '> 20% no-shows', 2: '15-20% no-shows', 3: '10-14% no-shows', 4: '5-9% no-shows (industry avg ~10%)', 5: '< 5% no-shows' } },
    { category: 'Cancellation Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '> 25% cancellations', 2: '20-25% cancellations', 3: '15-19% cancellations', 4: '10-14% cancellations (industry avg ~15%)', 5: '< 10% cancellations' } },
    { category: 'Average Production per Visit', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< $200/visit', 2: '$200-299/visit', 3: '$300-399/visit', 4: '$400-499/visit (industry avg ~$400)', 5: '$500+/visit' } },
    { category: 'Active Patient Count', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 500 active patients', 2: '500-999 active', 3: '1,000-1,499 active', 4: '1,500-1,999 active (varies by practice size)', 5: '2,000+ active' } },
    { category: 'Lost Patients', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '> 30% of base lost/year', 2: '20-30% lost/year', 3: '15-19% lost/year', 4: '10-14% lost/year (industry avg ~15%)', 5: '< 10% lost/year' } },
    { category: 'Referral Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 10% of new patients from referrals', 2: '10-19% from referrals', 3: '20-29% from referrals', 4: '30-39% from referrals', 5: '40%+ from referrals (strong word-of-mouth)' } },
  ],
};

// ── Patient Communications (dental) ──────────────────────────────
// Notion DB: "Patient Communications Report"

export const PATIENT_COMMS_CONFIG: ReportTypeConfig = {
  type: 'patient_comms',
  label: 'Patient Communications',
  categories: [
    { category: 'Email Campaigns', maxScore: 5, rubric: { 1: 'No email marketing', 2: 'Occasional blasts, no segmentation', 3: 'Regular emails with basic templates', 4: 'Segmented campaigns with branded templates', 5: 'Automated segmented campaigns with personalization and analytics' } },
    { category: 'Appointment Reminders', maxScore: 5, rubric: { 1: 'No automated reminders', 2: 'Phone-only reminders', 3: 'Automated email or SMS reminders', 4: 'Multi-channel reminders (email + SMS) with confirmation', 5: 'Automated multi-channel with 2-way confirmation and waitlist fill' } },
    { category: 'Recall Notifications', maxScore: 5, rubric: { 1: 'No recall system', 2: 'Manual recall, phone-only', 3: 'Automated email recalls', 4: 'Automated multi-channel recalls with tracking', 5: 'Smart recall sequences with escalation and re-engagement' } },
    { category: 'Review Requests', maxScore: 5, rubric: { 1: 'No review request process', 2: 'Verbal ask only', 3: 'Post-visit email with review link', 4: 'Automated review requests with platform routing', 5: 'Automated with follow-up, reputation monitoring, and response management' } },
    { category: 'Post-Treatment Follow-up', maxScore: 5, rubric: { 1: 'No post-treatment follow-up', 2: 'Occasional manual check-in', 3: 'Standard follow-up email or call', 4: 'Automated procedure-specific follow-up', 5: 'Personalized follow-up sequences with care instructions and check-ins' } },
    { category: 'Birthday/Holiday Messages', maxScore: 5, rubric: { 1: 'None sent', 2: 'Generic holiday email blast', 3: 'Automated birthday emails', 4: 'Branded birthday + holiday messages with personal touch', 5: 'Personalized messages with special offers and branded design' } },
    { category: 'Insurance/Billing Reminders', maxScore: 5, rubric: { 1: 'No billing reminders', 2: 'Manual billing statements only', 3: 'Automated balance reminders', 4: 'Insurance benefit reminders + balance notifications', 5: 'Proactive benefits expiration alerts, payment plans, and balance automation' } },
    { category: 'New Patient Welcome', maxScore: 5, rubric: { 1: 'No welcome communication', 2: 'Basic confirmation email only', 3: 'Welcome email with office info', 4: 'Welcome sequence with forms, directions, and what-to-expect', 5: 'Comprehensive onboarding sequence with video, forms, intro to team' } },
  ],
};

// ── Guest Experience (commercial real estate) ───────────────────────────────
// Notion DB: "Guest Report"

export const GUEST_CONFIG: ReportTypeConfig = {
  type: 'guest',
  label: 'Guest Experience',
  categories: [
    { category: 'Listing Quality', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: 'Minimal listing with few photos', 2: 'Basic listing, some missing info', 3: 'Complete listing with adequate photos', 4: 'Professional listing with quality photos and descriptions', 5: 'Exceptional listing — professional photography, detailed amenities, compelling copy' } },
    { category: 'Response Time', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '> 24hr response time', 2: '12-24hr response', 3: '4-12hr response', 4: '1-4hr response', 5: '< 1hr response or instant booking' } },
    { category: 'Guest Satisfaction', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 3.5 avg rating', 2: '3.5-3.9 avg', 3: '4.0-4.3 avg', 4: '4.4-4.7 avg', 5: '4.8+ avg rating' } },
    { category: 'Occupancy Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 40% occupancy', 2: '40-54% occupancy', 3: '55-64% occupancy', 4: '65-79% occupancy (market avg ~65%)', 5: '80%+ occupancy' } },
    { category: 'Revenue per Unit', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: 'Well below market average', 2: '20-30% below market', 3: 'Near market average', 4: '10-20% above market', 5: '20%+ above market average' } },
    { category: 'Repeat Guest Rate', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: '< 5% repeat guests', 2: '5-9% repeat', 3: '10-14% repeat', 4: '15-24% repeat', 5: '25%+ repeat guests' } },
    { category: 'Maintenance Response', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: 'No maintenance process, guest complaints unresolved', 2: 'Reactive only, slow turnaround', 3: 'Responsive within 24hr for most issues', 4: 'Same-day response with preventive schedule', 5: 'Proactive maintenance, < 4hr emergency response, guest satisfaction tracking' } },
    { category: 'Amenity Quality', maxScore: 5, defaultMetadata: { metric: '', industry_standard: '' }, rubric: { 1: 'Basic essentials only', 2: 'Standard amenities but dated', 3: 'Modern amenities meeting guest expectations', 4: 'Premium amenities exceeding category average', 5: 'Luxury amenities with thoughtful touches and consistent upgrades' } },
  ],
};

// ── Guest Communications (commercial real estate) ───────────────────────────
// Notion DB: "Guest Communications Report"

export const GUEST_COMMS_CONFIG: ReportTypeConfig = {
  type: 'guest_comms',
  label: 'Guest Communications',
  categories: [
    { category: 'Marketing Automation', maxScore: 5, rubric: { 1: 'No marketing automation', 2: 'Manual email blasts only', 3: 'Basic drip sequences set up', 4: 'Segmented automation with triggers', 5: 'Full lifecycle automation with personalization and analytics' } },
    { category: 'Booking Confirmations', maxScore: 5, rubric: { 1: 'No confirmation sent', 2: 'Platform-default confirmation only', 3: 'Branded confirmation email', 4: 'Branded with property details and check-in instructions', 5: 'Rich confirmation with video walkthrough, local guide, and upsells' } },
    { category: 'Pre-Arrival Sequences', maxScore: 5, rubric: { 1: 'No pre-arrival communication', 2: 'Single reminder before arrival', 3: 'Check-in instructions sent 1-2 days before', 4: 'Multi-step sequence with instructions, local tips, and upsells', 5: 'Personalized sequence with concierge-level detail and guest preferences' } },
    { category: 'Post-Stay Follow-up', maxScore: 5, rubric: { 1: 'No follow-up', 2: 'Generic thank-you email', 3: 'Thank-you with review request', 4: 'Branded follow-up with review, feedback survey, and return offer', 5: 'Personalized follow-up sequence with loyalty program enrollment' } },
    { category: 'Review Requests', maxScore: 5, rubric: { 1: 'No review requests sent', 2: 'Manual or inconsistent requests', 3: 'Automated post-stay review request', 4: 'Platform-specific routing with follow-up', 5: 'Automated with sentiment routing, response management, and monitoring' } },
    { category: 'Seasonal Promotions', maxScore: 5, rubric: { 1: 'No promotional campaigns', 2: 'Occasional ad-hoc promotions', 3: 'Regular seasonal email campaigns', 4: 'Segmented seasonal campaigns with dynamic pricing', 5: 'Data-driven promotions with past-guest targeting and urgency triggers' } },
    { category: 'Loyalty/Return Offers', maxScore: 5, rubric: { 1: 'No loyalty or return incentives', 2: 'Occasional discount codes', 3: 'Standard return-guest discount', 4: 'Structured loyalty tiers with repeat-guest benefits', 5: 'Comprehensive loyalty program with referral rewards and VIP perks' } },
    { category: 'Emergency Communications', maxScore: 5, rubric: { 1: 'No emergency communication plan', 2: 'Phone number only, no written protocol', 3: 'Emergency contact info provided at check-in', 4: 'Multi-channel emergency alerts with clear protocols', 5: 'Automated emergency system with real-time alerts, guest safety plan, and follow-up' } },
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
    case 'commercial-real-estate':
      return [
        makeOnlineReviewsConfig(ONLINE_REVIEWS_PLATFORMS_CRE),
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

// ── Rubric lookup ────────────────────────────────────────────────

/** Look up the rubric for a specific category within a report type config */
export function getRubric(
  reportType: ReportType,
  category: string,
  industry: Industry = null,
): Record<number, string> | undefined {
  const configs = getReportConfigs(industry);
  const config = configs.find((c) => c.type === reportType);
  if (!config) return undefined;
  const cat = config.categories.find((c) => c.category === category);
  return cat?.rubric;
}

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
        { key: 'competitor_name', header: 'Competitor', field: 'competitor_name', isMetadata: true, inputType: 'text', width: '160px' },
        statusCol,
        { key: 'distance', header: 'Distance', field: 'distance', isMetadata: true, inputType: 'text', width: '80px' },
        { key: 'services_offered', header: 'Services', field: 'services_offered', isMetadata: true, inputType: 'textarea', width: '160px' },
        { key: 'website_score', header: 'Website (/50)', field: 'website_score', isMetadata: true, inputType: 'number', min: 0, max: 50, step: 1, width: '100px' },
        { key: 'listings_reviews_score', header: 'Listings (/5)', field: 'listings_reviews_score', isMetadata: true, inputType: 'number', min: 0, max: 5, step: 1, width: '100px' },
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
