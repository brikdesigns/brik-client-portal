/**
 * Shared HTML analysis utilities used across website, brand, and other analyzers.
 */

const FETCH_HEADERS = {
  'User-Agent': 'BrikPortal/1.0 (Marketing Analysis)',
};

/**
 * Extract visible text from HTML by stripping tags, scripts, and styles.
 * Returns lowercase plaintext suitable for readability analysis.
 */
export function extractVisibleText(html: string): string {
  return html
    // Remove scripts and styles entirely
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Flesch-Kincaid Reading Ease score.
 * Higher = easier to read. 60-70 is standard, 80+ is very easy.
 *
 * Formula: 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
 */
export function fleschKincaid(text: string): {
  score: number;
  words: number;
  sentences: number;
  syllablesPerWord: number;
} {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = Math.max(1, words.length);
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const syllablesPerWord = totalSyllables / wordCount;

  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * syllablesPerWord;
  return { score: Math.round(Math.max(0, Math.min(100, score))), words: wordCount, sentences, syllablesPerWord };
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g) || [];
  let count = vowelGroups.length;
  // Silent e at end
  if (w.endsWith('e') && count > 1) count--;
  // -le ending
  if (w.endsWith('le') && w.length > 2 && !/[aeiouy]/.test(w[w.length - 3])) count++;
  return Math.max(1, count);
}

/**
 * Extract heading hierarchy from HTML. Returns counts and whether
 * the hierarchy is well-structured (H1 → H2 → H3, no skipping).
 */
export function analyzeHeadingHierarchy(html: string): {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  totalHeadings: number;
  isWellStructured: boolean;
} {
  const headings: number[] = [];
  const headingRegex = /<h([1-6])[^>]*>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(match[1], 10));
  }

  const h1Count = headings.filter((h) => h === 1).length;
  const h2Count = headings.filter((h) => h === 2).length;
  const h3Count = headings.filter((h) => h === 3).length;

  // Well-structured: has H1, doesn't skip levels (e.g. H1 → H3 with no H2)
  let isWellStructured = h1Count === 1;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      isWellStructured = false;
      break;
    }
  }

  return { h1Count, h2Count, h3Count, totalHeadings: headings.length, isWellStructured };
}

/**
 * Detect CTA (call-to-action) elements in HTML.
 */
export function detectCTAs(html: string): {
  buttonCount: number;
  ctaTextCount: number;
  hasPhoneNumber: boolean;
  hasCTAs: boolean;
} {
  const htmlLower = html.toLowerCase();
  const buttonCount = (html.match(/<button/gi) || []).length
    + (html.match(/type=["']submit["']/gi) || []).length
    + (html.match(/class=["'][^"']*btn[^"']*["']/gi) || []).length;

  const ctaPatterns = [
    'book now', 'schedule', 'contact us', 'get started', 'free consultation',
    'call now', 'request', 'sign up', 'learn more', 'get in touch',
    'make an appointment', 'request a quote', 'free estimate',
  ];
  const ctaTextCount = ctaPatterns.filter((p) => htmlLower.includes(p)).length;
  const hasPhoneNumber = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(html);

  return {
    buttonCount,
    ctaTextCount,
    hasPhoneNumber,
    hasCTAs: buttonCount > 0 || ctaTextCount > 0,
  };
}

/**
 * Detect modern CSS patterns that indicate thoughtful design.
 */
export function detectModernCSS(html: string): {
  hasGrid: boolean;
  hasFlexbox: boolean;
  hasCustomProperties: boolean;
  customPropertyCount: number;
  hasAnimations: boolean;
  hasResponsiveImages: boolean;
  hasDarkMode: boolean;
  modernPatternCount: number;
} {
  const htmlLower = html.toLowerCase();

  const hasGrid = htmlLower.includes('display: grid') || htmlLower.includes('display:grid');
  const hasFlexbox = htmlLower.includes('display: flex') || htmlLower.includes('display:flex');
  const customProps = html.match(/--[\w-]+/g) || [];
  const hasCustomProperties = customProps.length > 5;
  const hasAnimations = htmlLower.includes('animation') || htmlLower.includes('transition') || htmlLower.includes('@keyframes');
  const hasResponsiveImages = htmlLower.includes('srcset') || htmlLower.includes('<picture');
  const hasDarkMode = htmlLower.includes('prefers-color-scheme');

  let modernPatternCount = 0;
  if (hasGrid) modernPatternCount++;
  if (hasFlexbox) modernPatternCount++;
  if (hasCustomProperties) modernPatternCount++;
  if (hasAnimations) modernPatternCount++;
  if (hasResponsiveImages) modernPatternCount++;
  if (hasDarkMode) modernPatternCount++;

  return {
    hasGrid,
    hasFlexbox,
    hasCustomProperties,
    customPropertyCount: customProps.length,
    hasAnimations,
    hasResponsiveImages,
    hasDarkMode,
    modernPatternCount,
  };
}

/**
 * Crawl internal links from a page's HTML and fetch up to `limit` pages.
 * Returns an array of { url, html } for each successfully fetched page.
 */
export async function crawlInternalPages(
  baseUrl: string,
  html: string,
  limit: number = 4,
): Promise<Array<{ url: string; html: string }>> {
  const base = new URL(baseUrl);
  const linkRegex = /href=["']([^"'#]+)["']/gi;
  const internalUrls = new Set<string>();

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl);
      // Same domain, not a file (pdf, jpg, etc.), not the same page
      if (
        resolved.hostname === base.hostname &&
        resolved.pathname !== base.pathname &&
        !resolved.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|xml|zip)$/i)
      ) {
        internalUrls.add(resolved.origin + resolved.pathname);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Fetch up to `limit` pages in parallel
  const urls = [...internalUrls].slice(0, limit);
  const results: Array<{ url: string; html: string }> = [];

  const fetches = urls.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      });
      if (res.ok) {
        const pageHtml = await res.text();
        results.push({ url, html: pageHtml });
      }
    } catch {
      // Skip pages that fail
    }
  });

  await Promise.all(fetches);
  return results;
}
