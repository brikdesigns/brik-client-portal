/**
 * Generate initial report rows for each report type.
 *
 * When a report set is created, this module produces the report + report_item
 * rows based on the client's industry. Analyzable report types (website,
 * brand/logo, online reviews, competitors) get auto-populated where possible;
 * all others start as draft templates for manual entry.
 */

import { type Industry, getReportConfigs, type ReportTypeConfig } from './report-config';
import { calculateTier } from './scoring';
import { analyzeWebsite, type WebsiteCheckResult } from './website';
import { analyzeBrand } from './brand';
import { analyzeReviews } from './reviews';
import { analyzeCompetitors } from './competitors';

/** Client data passed through from the API route */
export interface ClientData {
  name: string;
  address: string | null;
  websiteUrl: string | null;
  phone: string | null;
  industry: Industry;
}

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
 * Generate report + item templates for a given client.
 * Analyzable reports are auto-populated; others start as draft templates.
 */
export async function seedReports(
  reportSetId: string,
  clientData: ClientData,
  insertReport: (report: ReportRow) => Promise<string>,
): Promise<SeedResult> {
  const configs = getReportConfigs(clientData.industry);
  const allReports: ReportRow[] = [];
  const allItems: ReportItemRow[] = [];

  for (const config of configs) {
    const maxScore = config.categories.reduce((sum, c) => sum + c.maxScore, 0);

    // Run the appropriate analyzer for this report type
    let analysisResults: WebsiteCheckResult[] | null = null;

    try {
      analysisResults = await runAnalyzer(config.type, clientData, config);
    } catch {
      // Analysis failed — leave as draft
    }

    // Compute score from analysis results
    const scoredItems = analysisResults?.filter((r) => r.score !== null) ?? [];
    const score = scoredItems.length > 0
      ? scoredItems.reduce((sum, r) => sum + (r.score ?? 0), 0)
      : null;
    const tier = score !== null ? calculateTier(score, maxScore) : null;

    // Determine status: completed if all scored, in_progress if partial, draft if none
    const status = analysisResults
      ? (analysisResults.some((r) => r.score === null) ? 'in_progress' : 'completed')
      : 'draft';

    const opportunities = analysisResults
      ? generateOpportunities(analysisResults)
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

    // Create items from analysis results or empty templates
    const items = analysisResults
      ? createItemsFromAnalysis(reportId, config, analysisResults)
      : createEmptyItems(reportId, config);

    allItems.push(...items);
  }

  return { reports: allReports, items: allItems };
}

/**
 * Dispatch to the appropriate analyzer for a report type.
 * Returns null if no auto-analysis is available for this type.
 */
async function runAnalyzer(
  reportType: string,
  clientData: ClientData,
  config: ReportTypeConfig,
): Promise<WebsiteCheckResult[] | null> {
  switch (reportType) {
    case 'website':
      if (!clientData.websiteUrl) return null;
      return analyzeWebsite(clientData.websiteUrl);

    case 'brand_logo':
      if (!clientData.websiteUrl) return null;
      return analyzeBrand(clientData.websiteUrl);

    case 'online_reviews':
      if (!clientData.name) return null;
      return analyzeReviews(
        clientData.name,
        clientData.address,
        config.categories.map((c) => c.category),
      );

    case 'competitors':
      return analyzeCompetitors(
        clientData.name,
        clientData.address,
        clientData.industry,
      );

    default:
      return null;
  }
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
  return config.categories.map((cat, index) => {
    const result = results.find((r) => r.category === cat.category);
    if (result) {
      return {
        report_id: reportId,
        category: result.category,
        status: result.status,
        score: result.score,
        rating: (result.metadata?.rating as number) ?? null,
        total_reviews: (result.metadata?.total_reviews as number) ?? null,
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

function generateOpportunities(results: WebsiteCheckResult[]): string {
  const lines: string[] = [];

  const issues = results.filter((r) => r.score !== null && r.score <= 2);
  for (const issue of issues) {
    if (issue.feedback_summary) {
      lines.push(`**${issue.category}:** ${issue.feedback_summary}`);
    }
  }

  const manualCategories = results.filter((r) => r.score === null);
  if (manualCategories.length > 0) {
    lines.push(
      `**Manual review needed:** ${manualCategories.map((r) => r.category).join(', ')} — these categories require manual assessment.`
    );
  }

  if (lines.length === 0) {
    return 'Auto-analyzed categories look strong. Complete manual review for remaining categories to finalize the report.';
  }

  return lines.join('\n\n');
}
