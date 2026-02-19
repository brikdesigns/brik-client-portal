/**
 * Generate initial report rows for each report type.
 *
 * When a report set is created, this module produces the report + report_item
 * rows based on the client's industry. Items start as 'neutral' with no scores —
 * except for website reports, which are auto-analyzed.
 */

import { type Industry, getReportConfigs, type ReportTypeConfig } from './report-config';
import { calculateTier } from './scoring';
import { analyzeWebsite } from './website';

interface ReportRow {
  report_set_id: string;
  report_type: string;
  status: string;
  score: number | null;
  max_score: number | null;
  tier: string | null;
  opportunities_text: string | null;
}

interface ReportItemRow {
  report_id: string;
  category: string;
  status: string;
  score: number | null;
  rating: number | null;
  total_reviews: number | null;
  feedback_summary: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
}

interface SeedResult {
  reports: ReportRow[];
  items: ReportItemRow[];
}

/**
 * Generate report + item templates for a given industry.
 * Website analysis is run automatically if websiteUrl is provided.
 */
export async function seedReports(
  reportSetId: string,
  industry: Industry,
  websiteUrl: string | null,
  insertReport: (report: ReportRow) => Promise<string>,
): Promise<SeedResult> {
  const configs = getReportConfigs(industry);
  const allReports: ReportRow[] = [];
  const allItems: ReportItemRow[] = [];

  for (const config of configs) {
    const maxScore = config.categories.reduce((sum, c) => sum + c.maxScore, 0);

    // Auto-analyze website if URL provided
    let websiteResults: Awaited<ReturnType<typeof analyzeWebsite>> | null = null;
    if (config.type === 'website' && websiteUrl) {
      try {
        websiteResults = await analyzeWebsite(websiteUrl);
      } catch {
        // Website analysis failed — leave as draft
      }
    }

    const score = websiteResults
      ? websiteResults.reduce((sum, r) => sum + r.score, 0)
      : null;
    const tier = score !== null ? calculateTier(score, maxScore) : null;
    const status = websiteResults ? 'completed' : 'draft';

    const opportunities = websiteResults
      ? generateWebsiteOpportunities(websiteResults)
      : null;

    const report: ReportRow = {
      report_set_id: reportSetId,
      report_type: config.type,
      status,
      score,
      max_score: maxScore,
      tier,
      opportunities_text: opportunities,
    };

    // Insert report and get back the ID
    const reportId = await insertReport(report);
    allReports.push(report);

    // Create items from category templates
    const items = websiteResults
      ? createItemsFromAnalysis(reportId, websiteResults)
      : createEmptyItems(reportId, config);

    allItems.push(...items);
  }

  return { reports: allReports, items: allItems };
}

function createEmptyItems(reportId: string, config: ReportTypeConfig): ReportItemRow[] {
  return config.categories.map((cat, index) => ({
    report_id: reportId,
    category: cat.category,
    status: 'neutral',
    score: null,
    rating: null,
    total_reviews: null,
    feedback_summary: null,
    notes: null,
    metadata: { maxScore: cat.maxScore },
    sort_order: index,
  }));
}

function createItemsFromAnalysis(
  reportId: string,
  results: Awaited<ReturnType<typeof analyzeWebsite>>,
): ReportItemRow[] {
  return results.map((result, index) => ({
    report_id: reportId,
    category: result.category,
    status: result.status,
    score: result.score,
    rating: null,
    total_reviews: null,
    feedback_summary: result.feedback_summary,
    notes: result.notes,
    metadata: result.metadata as Record<string, unknown>,
    sort_order: index,
  }));
}

function generateWebsiteOpportunities(
  results: Awaited<ReturnType<typeof analyzeWebsite>>,
): string {
  const issues = results.filter((r) => r.status === 'error' || r.status === 'warning');
  if (issues.length === 0) {
    return 'Website meets all basic standards. Consider advanced optimizations like structured data, page speed improvements, and accessibility audits.';
  }

  const lines = issues.map((issue) => {
    switch (issue.category) {
      case 'SSL Certificate':
        return 'Install an SSL certificate to secure the website and improve search rankings.';
      case 'Mobile Responsive':
        return 'Add a viewport meta tag and ensure the site is mobile-friendly — over 60% of web traffic is mobile.';
      case 'Page Speed':
        return 'Optimize page load time by compressing images, enabling caching, and minimizing JavaScript.';
      case 'SEO Meta Tags':
        return 'Add a descriptive meta title and description to improve search engine visibility.';
      case 'Open Graph Tags':
        return 'Configure Open Graph tags so social media shares display rich previews with images and descriptions.';
      case 'Contact Information':
        return 'Add visible phone number and email address to the website for easy client contact.';
      case 'Social Media Links':
        return 'Link to active social media profiles to build credibility and engagement.';
      default:
        return `Address ${issue.category}: ${issue.feedback_summary}`;
    }
  });

  return lines.join('\n\n');
}
