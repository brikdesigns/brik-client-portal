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

/**
 * Build a consultative summary from analysis results.
 * Exported so the analyze route can regenerate it after re-analysis.
 *
 * Voice: StoryBrand (client is the hero, we're the guide) + Sandler
 * (reference specific pains, quantify impact) + Brik (warm, clear,
 * confident but not pushy). Summaries should read like a trusted
 * advisor explaining what the data means — not a robot listing stats.
 *
 * Dispatches to report-type-specific generators for tailored output.
 */
export function generateOpportunities(results: WebsiteCheckResult[]): string {
  const passed = results.filter(
    (r) => r.status === 'pass' && r.score !== null,
  );
  const issues = results.filter(
    (r) =>
      r.score !== null &&
      (r.status === 'fail' || r.status === 'warning' ||
        (r.score <= 2 && r.status !== 'pass')),
  );
  const unscored = results.filter((r) => r.score === null);

  // Detect report type by shape of the data
  const isListingsReport = results.length > 0 && results.every(
    (r) => r.score === null || r.score === 0 || r.score === 1,
  );
  const isCompetitorReport = results.length > 0 && results.some(
    (r) => r.category.startsWith('Competitor ') && r.metadata?.competitor_name !== undefined,
  );

  if (isCompetitorReport) {
    return generateCompetitorOpportunities(results, unscored);
  }
  if (isListingsReport) {
    return generateListingsOpportunities(results, passed, issues, unscored);
  }
  return generateScoredOpportunities(results, passed, issues, unscored);
}

// ── Online Listings & Reviews ──────────────────────────────────────

function generateListingsOpportunities(
  results: WebsiteCheckResult[],
  passed: WebsiteCheckResult[],
  issues: WebsiteCheckResult[],
  unscored: WebsiteCheckResult[],
): string {
  const sentences: string[] = [];
  const total = results.length;
  const listedCount = passed.length;

  // Aggregate ratings and reviews
  const withRatings = passed.filter((r) => {
    const rating = r.metadata?.rating as number | null;
    return rating !== null && rating !== undefined;
  });
  const totalReviews = passed.reduce(
    (sum, r) => sum + ((r.metadata?.total_reviews as number) ?? 0), 0,
  );

  // Opening — what the data tells us (guide framing)
  if (listedCount === total && totalReviews > 500) {
    sentences.push(
      `Your online presence is strong — listed on all ${total} platforms with ${totalReviews.toLocaleString()} reviews across them.`,
    );
  } else if (listedCount === total) {
    sentences.push(
      `You're listed on all ${total} platforms we checked, which is a solid foundation.`,
    );
  } else {
    const coverage = Math.round((listedCount / total) * 100);
    sentences.push(
      `You're currently visible on ${listedCount} of ${total} platforms (${coverage}% coverage).`,
    );
  }

  // Rating context — what it means for their business
  if (withRatings.length > 0) {
    const ratings = withRatings.map((r) => r.metadata?.rating as number);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const avgStr = avgRating.toFixed(1);

    if (avgRating >= 4.5 && totalReviews > 100) {
      sentences.push(
        `With a ${avgStr} average rating and ${totalReviews.toLocaleString()} total reviews, your reputation is a real competitive advantage — new patients searching online will see strong social proof.`,
      );
    } else if (avgRating >= 4.0) {
      sentences.push(
        `Your ${avgStr} average rating is solid. Continuing to encourage reviews will help maintain momentum, especially on platforms where your review count is still building.`,
      );
    } else if (avgRating >= 3.5) {
      sentences.push(
        `At ${avgStr} average, your rating is fair but there's room to grow. A consistent review request strategy could make a meaningful difference in how new patients perceive you online.`,
      );
    } else {
      sentences.push(
        `Your ${avgStr} average rating may be turning away potential patients before they ever call. Addressing the reviews and building a proactive request strategy would be a high-impact starting point.`,
      );
    }
  }

  // Missing listings — the specific opportunity (Sandler: quantify the gap)
  if (issues.length > 0) {
    const wrongLocation = issues.filter((r) => r.metadata?.rejectedLocation);
    const notFound = issues.filter((r) => !r.metadata?.rejectedLocation);

    if (notFound.length > 0) {
      sentences.push(
        `We didn't find you on ${notFound.map((r) => r.category).join(' or ')}. These are platforms where patients actively search, so each missing listing is a missed chance to be found.`,
      );
    }
    if (wrongLocation.length > 0) {
      sentences.push(
        `${wrongLocation.map((r) => r.category).join(' and ')} ${wrongLocation.length === 1 ? 'shows a' : 'show'} listing for a different location with the same name. Claiming your correct listing would prevent patients from being directed to the wrong practice.`,
      );
    }
  }

  // Data consistency — NAP (Name, Address, Phone) consistency matters for SEO
  const missingPhone = passed.filter((r) => !r.metadata?.phone_listed);
  const missingAddress = passed.filter((r) => !r.metadata?.address_listed);
  const hasNapGaps = (missingPhone.length > 0 && missingPhone.length < passed.length)
    || (missingAddress.length > 0 && missingAddress.length < passed.length);

  if (hasNapGaps) {
    const gapPlatforms = new Set([
      ...missingPhone.map((r) => r.category),
      ...missingAddress.map((r) => r.category),
    ]);
    sentences.push(
      `Contact details are inconsistent across platforms — ${Array.from(gapPlatforms).join(', ')} ${gapPlatforms.size === 1 ? 'is' : 'are'} missing phone or address info. Consistent NAP (name, address, phone) data across all listings directly impacts local search rankings.`,
    );
  }

  // Unverified
  if (unscored.length > 0) {
    sentences.push(
      `We couldn't auto-verify ${unscored.map((r) => r.category).join(' or ')} — a quick manual check would complete the picture.`,
    );
  }

  return sentences.join(' ');
}

// ── Competitor Analysis ──────────────────────────────────────────────

function generateCompetitorOpportunities(
  results: WebsiteCheckResult[],
  unscored: WebsiteCheckResult[],
): string {
  const sentences: string[] = [];

  const analyzed = results.filter(
    (r) => r.score !== null && r.metadata?.competitor_name,
  );

  if (analyzed.length === 0 && unscored.length > 0) {
    return 'We couldn\'t locate competitors for analysis — this typically means the address needs to be updated or the industry type needs to be set. Once that\'s corrected, we can re-run this report.';
  }

  if (analyzed.length === 0) {
    return 'No competitor data available yet.';
  }

  // Extract competitor details for meaningful comparison
  const competitors = analyzed.map((r) => ({
    name: r.metadata?.competitor_name as string,
    distance: r.metadata?.distance as string,
    websiteScore: r.metadata?.website_score as number | null,
    listingsScore: r.metadata?.listings_reviews_score as number | null,
    googleRating: r.metadata?.google_rating as number | null,
    googleReviews: r.metadata?.google_reviews as number | null,
    websiteExplanation: r.metadata?.website_score_explanation as string,
  }));

  // Landscape overview — set the scene
  const distances = competitors
    .map((c) => c.distance)
    .filter(Boolean);
  const closestDistance = distances[0] || '';

  sentences.push(
    `We identified ${analyzed.length} competitor${analyzed.length === 1 ? '' : 's'} within your area${closestDistance ? `, with the nearest (${competitors[0].name}) just ${closestDistance} away` : ''}.`,
  );

  // Website comparison — where do you stand?
  const withWebScores = competitors.filter((c) => c.websiteScore !== null);
  if (withWebScores.length > 0) {
    const scores = withWebScores.map((c) => c.websiteScore!);
    const avgWebScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxWebScore = Math.max(...scores);
    const bestWeb = withWebScores.find((c) => c.websiteScore === maxWebScore);

    if (avgWebScore >= 35) {
      sentences.push(
        `Your competitors' websites are generally strong, averaging ${avgWebScore}/50. ${bestWeb ? `${bestWeb.name} leads at ${maxWebScore}/50` : ''} — this is the bar your site needs to meet or exceed to stand out in local search.`,
      );
    } else if (avgWebScore >= 20) {
      sentences.push(
        `Competitor websites average ${avgWebScore}/50 — there's a real opportunity to differentiate through a stronger web presence. ${bestWeb && bestWeb.websiteScore! >= 30 ? `${bestWeb.name} is currently the strongest at ${maxWebScore}/50, but that's still very beatable.` : 'None are particularly impressive, which means a quality website would immediately set you apart.'}`,
      );
    } else {
      sentences.push(
        `Competitor websites are weak across the board (averaging just ${avgWebScore}/50). A well-built, modern website would give you an immediate and significant competitive edge in your market.`,
      );
    }

    // Call out specific weaknesses in competitors (Sandler: show where the opening is)
    const weakCompetitors = withWebScores.filter((c) => c.websiteExplanation?.startsWith('Weak'));
    if (weakCompetitors.length > 0) {
      const weakAreas = weakCompetitors.map(
        (c) => `${c.name} (${c.websiteExplanation?.replace('Weak areas: ', '').replace(/\.$/, '')})`,
      );
      sentences.push(
        `Notable competitor gaps: ${weakAreas.join('; ')}.`,
      );
    }
  }

  // Reviews comparison — the social proof battle
  const withReviews = competitors.filter(
    (c) => c.googleRating !== null && c.googleReviews !== null,
  );
  if (withReviews.length > 0) {
    const ratings = withReviews.map((c) => `${c.name}: ${c.googleRating} stars (${c.googleReviews?.toLocaleString()} reviews)`);
    const bestReviewed = withReviews.reduce((best, c) =>
      (c.googleReviews ?? 0) > (best.googleReviews ?? 0) ? c : best,
    );

    sentences.push(
      `On Google, your competitors' review profiles look like this: ${ratings.join(', ')}. ${bestReviewed.googleReviews! > 200 ? `${bestReviewed.name}'s ${bestReviewed.googleReviews?.toLocaleString()} reviews represent strong social proof — matching that volume takes sustained effort but is achievable with a consistent review request process.` : 'Review counts are still manageable, so there\'s a window to build a lead with a proactive review strategy.'}`,
    );
  }

  // Unanalyzed slots
  const empty = results.filter((r) => !r.metadata?.competitor_name);
  if (empty.length > 0 && analyzed.length > 0) {
    // Don't mention — just means fewer than 3 competitors found
  }

  return sentences.join(' ');
}

// ── Website, Brand/Logo, and other scored reports ────────────────────

function generateScoredOpportunities(
  results: WebsiteCheckResult[],
  passed: WebsiteCheckResult[],
  issues: WebsiteCheckResult[],
  unscored: WebsiteCheckResult[],
): string {
  const scored = results.filter((r) => r.score !== null);
  if (scored.length === 0) {
    return 'Analysis is pending — run the report to generate insights.';
  }

  const totalScore = scored.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const maxPossible = scored.length * 5;
  const pct = Math.round((totalScore / maxPossible) * 100);

  // Build a concise 2-3 sentence summary that synthesizes the audit
  // into what it means for the client — not a category-by-category rehash.

  const strong = results.filter((r) => r.score !== null && r.score >= 4);
  const weak = issues.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const topWeakNames = weak.slice(0, 3).map((r) => r.category.toLowerCase());

  // Sentence 1: Overall position framed as context, not a grade
  let opening: string;
  if (pct >= 80) {
    opening = `Your overall score of ${totalScore}/${maxPossible} reflects a strong foundation${strong.length > 0 ? `, especially in ${strong.slice(0, 2).map((r) => r.category.toLowerCase()).join(' and ')}` : ''}.`;
  } else if (pct >= 60) {
    opening = `At ${totalScore}/${maxPossible}, you have a solid base to build on${strong.length > 0 ? ` — ${strong.slice(0, 2).map((r) => r.category.toLowerCase()).join(' and ')} ${strong.length === 1 ? 'is' : 'are'} already working in your favor` : ''}.`;
  } else if (pct >= 40) {
    opening = `Scoring ${totalScore}/${maxPossible} means there are gaps that may be affecting how potential clients perceive you online${strong.length > 0 ? `, though ${strong.slice(0, 2).map((r) => r.category.toLowerCase()).join(' and ')} ${strong.length === 1 ? 'shows' : 'show'} real strength` : ''}.`;
  } else {
    opening = `At ${totalScore}/${maxPossible}, there's significant room to grow — but that also means even small improvements will make a noticeable difference.`;
  }

  // Sentence 2: What matters most — the highest-impact areas to address
  let focus: string;
  if (topWeakNames.length === 0) {
    focus = 'No major issues stood out — maintaining what you have and refining the details will keep you ahead.';
  } else if (topWeakNames.length === 1) {
    focus = `The biggest opportunity is ${topWeakNames[0]}, which is where focused effort would have the most visible impact on how clients experience your brand.`;
  } else {
    focus = `The biggest opportunities are in ${topWeakNames.slice(0, -1).join(', ')} and ${topWeakNames[topWeakNames.length - 1]} — these are the areas where improvements would be most visible to potential clients.`;
  }

  // Sentence 3 (conditional): Unscored items need a manual look
  if (unscored.length > 0) {
    const unscoredNames = unscored.map((r) => r.category.toLowerCase()).join(' and ');
    return `${opening} ${focus} We couldn't auto-verify ${unscoredNames}, so a quick manual review would complete the picture.`;
  }

  return `${opening} ${focus}`;
}
