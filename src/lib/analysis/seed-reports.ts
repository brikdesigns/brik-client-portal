/**
 * Generate initial report rows for each report type.
 *
 * When a report set is created, this module produces the report + report_item
 * rows based on the client's industry. Website reports get partial auto-analysis;
 * all others start as draft templates for manual entry.
 */

import { type Industry, getReportConfigs, type ReportTypeConfig } from './report-config';
import { calculateTier } from './scoring';
import { analyzeWebsite, type WebsiteCheckResult } from './website';

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
    let websiteResults: WebsiteCheckResult[] | null = null;
    if (config.type === 'website' && websiteUrl) {
      try {
        websiteResults = await analyzeWebsite(websiteUrl);
      } catch {
        // Website analysis failed — leave as draft
      }
    }

    // Website reports with results are "in_progress" (not completed) since
    // manual categories (Overall Design, Content Clarity, Branding Consistency)
    // still need human review
    const scoredItems = websiteResults?.filter((r) => r.score !== null) ?? [];
    const score = scoredItems.length > 0
      ? scoredItems.reduce((sum, r) => sum + (r.score ?? 0), 0)
      : null;
    const tier = score !== null ? calculateTier(score, maxScore) : null;
    const status = websiteResults
      ? (websiteResults.some((r) => r.score === null) ? 'in_progress' : 'completed')
      : 'draft';

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
      ? createItemsFromAnalysis(reportId, config, websiteResults)
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
    metadata: {
      maxScore: cat.maxScore,
      ...(cat.defaultMetadata ?? {}),
    },
    sort_order: index,
  }));
}

function createItemsFromAnalysis(
  reportId: string,
  config: ReportTypeConfig,
  results: WebsiteCheckResult[],
): ReportItemRow[] {
  // Match results to config categories by name
  return config.categories.map((cat, index) => {
    const result = results.find((r) => r.category === cat.category);
    if (result) {
      return {
        report_id: reportId,
        category: result.category,
        status: result.status,
        score: result.score,
        rating: null,
        total_reviews: null,
        feedback_summary: result.feedback_summary,
        notes: result.notes,
        metadata: {
          maxScore: cat.maxScore,
          ...result.metadata,
        },
        sort_order: index,
      };
    }
    // Fallback: category exists in config but not in results
    return {
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
    };
  });
}

function generateWebsiteOpportunities(results: WebsiteCheckResult[]): string {
  const lines: string[] = [];

  // Issues from auto-analyzed categories
  const issues = results.filter((r) => r.score !== null && r.score <= 2);
  for (const issue of issues) {
    if (issue.feedback_summary) {
      lines.push(`**${issue.category}:** ${issue.feedback_summary}`);
    }
  }

  // Note which categories need manual review
  const manualCategories = results.filter((r) => r.score === null);
  if (manualCategories.length > 0) {
    lines.push(
      `**Manual review needed:** ${manualCategories.map((r) => r.category).join(', ')} — these categories require visual assessment.`
    );
  }

  if (lines.length === 0) {
    return 'Auto-analyzed categories look strong. Complete manual review for Overall Design, Content Clarity, and Branding Consistency to finalize the report.';
  }

  return lines.join('\n\n');
}
