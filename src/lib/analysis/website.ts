/**
 * Automated website analysis.
 *
 * Evaluates a client's website across 10 categories matching the Notion
 * "Website Report" database. Most categories are auto-scored from HTML;
 * remaining gaps can be refined by an admin in the edit table.
 *
 * Categories (scored 1-5, max 50):
 * 1. Overall Design — auto (modern CSS patterns)
 * 2. Mobile Responsiveness — partial auto
 * 3. Navigation — partial auto
 * 4. Content Clarity — auto (readability + heading + CTA analysis)
 * 5. Booking/Inquiries — partial auto
 * 6. Photos & Media — partial auto
 * 7. SEO Optimization — auto
 * 8. Speed & Performance — partial auto
 * 9. Branding Consistency — auto (multi-page comparison)
 * 10. Trust Signals — auto
 */

export interface WebsiteCheckResult {
  category: string;
  status: 'pass' | 'warning' | 'fail' | 'error' | 'neutral';
  score: number | null;
  feedback_summary: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

import {
  extractVisibleText,
  fleschKincaid,
  analyzeHeadingHierarchy,
  detectCTAs,
  detectModernCSS,
  crawlInternalPages,
} from './html-utils';

export async function analyzeWebsite(url: string): Promise<WebsiteCheckResult[]> {
  const results: WebsiteCheckResult[] = [];

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let html = '';
  let responseTime = 0;
  let isHttps = false;
  let fetchError: string | null = null;

  try {
    const parsedUrl = new URL(normalizedUrl);
    isHttps = parsedUrl.protocol === 'https:';

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BrikPortal/1.0 (Marketing Analysis)' },
      redirect: 'follow',
    });

    clearTimeout(timeout);
    responseTime = Date.now() - start;
    html = await res.text();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to fetch';
  }

  const htmlLower = fetchError ? '' : html.toLowerCase();

  // 1. Overall Design — scored via modern CSS patterns
  if (fetchError) {
    results.push(unreachable('Overall Design', fetchError));
  } else {
    const css = detectModernCSS(html);
    const hasViewport = htmlLower.includes('name="viewport"') || htmlLower.includes("name='viewport'");

    let score = 1;
    if (css.modernPatternCount >= 5) score = 5;
    else if (css.modernPatternCount >= 4) score = 4;
    else if (css.modernPatternCount >= 2 && hasViewport) score = 3;
    else if (css.modernPatternCount >= 1) score = 2;

    const highlights: string[] = [];
    if (css.hasGrid) highlights.push('CSS Grid');
    if (css.hasFlexbox) highlights.push('Flexbox');
    if (css.hasCustomProperties) highlights.push(`${css.customPropertyCount} design tokens`);
    if (css.hasAnimations) highlights.push('animations');
    if (css.hasResponsiveImages) highlights.push('responsive images');
    if (css.hasDarkMode) highlights.push('dark mode');

    results.push({
      category: 'Overall Design',
      status: tierFromScore(score),
      score,
      feedback_summary: highlights.length > 0
        ? `Modern design patterns detected: ${highlights.join(', ')}.`
        : 'Few modern CSS patterns detected. Design may benefit from updated techniques.',
      notes: null,
      metadata: { ...css, automatable: true },
    });
  }

  // 2. Mobile Responsiveness
  if (fetchError) {
    results.push(unreachable('Mobile Responsiveness', fetchError));
  } else {
    const hasViewport = htmlLower.includes('name="viewport"') || htmlLower.includes("name='viewport'");
    const hasMediaQueries = htmlLower.includes('@media') && (htmlLower.includes('max-width') || htmlLower.includes('min-width'));
    const score = hasViewport ? (hasMediaQueries ? 4 : 3) : 1;
    results.push({
      category: 'Mobile Responsiveness',
      status: tierFromScore(score),
      score,
      feedback_summary: hasViewport
        ? hasMediaQueries
          ? 'Viewport meta tag and responsive media queries detected.'
          : 'Viewport meta tag found, but limited responsive CSS detected.'
        : 'No viewport meta tag found. Site may not display correctly on mobile devices.',
      notes: null,
      metadata: { hasViewport, hasMediaQueries },
    });
  }

  // 3. Navigation — check for nav structure
  if (fetchError) {
    results.push(unreachable('Navigation', fetchError));
  } else {
    const hasNav = htmlLower.includes('<nav') || htmlLower.includes('role="navigation"');
    const linkCount = (html.match(/<a\s/gi) || []).length;
    const hasFooter = htmlLower.includes('<footer');
    const score = hasNav ? (linkCount > 5 && hasFooter ? 4 : 3) : 2;
    results.push({
      category: 'Navigation',
      status: tierFromScore(score),
      score,
      feedback_summary: hasNav
        ? `Navigation element found with ${linkCount} links${hasFooter ? ' and footer navigation' : ''}.`
        : 'No semantic <nav> element found. Navigation structure may need improvement.',
      notes: null,
      metadata: { hasNav, linkCount, hasFooter },
    });
  }

  // 4. Content Clarity — readability, heading structure, CTAs
  if (fetchError) {
    results.push(unreachable('Content Clarity', fetchError));
  } else {
    const visibleText = extractVisibleText(html);
    const readability = fleschKincaid(visibleText);
    const headings = analyzeHeadingHierarchy(html);
    const ctas = detectCTAs(html);

    let score = 1;
    // Readability: 60+ is standard, 80+ is very easy
    if (readability.score >= 60) score++;
    if (readability.score >= 40) score++; // At least somewhat readable
    // Good heading structure
    if (headings.isWellStructured && headings.totalHeadings >= 3) score++;
    // Has clear CTAs
    if (ctas.hasCTAs) score++;
    score = Math.min(5, score);

    const parts: string[] = [];
    parts.push(`Readability score: ${readability.score}/100 (${readability.score >= 60 ? 'good' : readability.score >= 40 ? 'moderate' : 'difficult'})`);
    parts.push(`${headings.totalHeadings} headings${headings.isWellStructured ? ' (well-structured)' : ' (hierarchy issues)'}`);
    if (ctas.hasCTAs) {
      parts.push(`${ctas.buttonCount} buttons, ${ctas.ctaTextCount} CTA phrases`);
    } else {
      parts.push('no clear calls-to-action');
    }

    results.push({
      category: 'Content Clarity',
      status: tierFromScore(score),
      score,
      feedback_summary: parts.join('. ') + '.',
      notes: readability.words < 100 ? 'Very little visible text detected — page may rely heavily on images or JavaScript rendering.' : null,
      metadata: {
        automatable: true,
        readabilityScore: readability.score,
        wordCount: readability.words,
        sentenceCount: readability.sentences,
        ...headings,
        ...ctas,
      },
    });
  }

  // 5. Booking/Inquiries — check for forms and booking widgets
  if (fetchError) {
    results.push(unreachable('Booking/Inquiries', fetchError));
  } else {
    const hasForm = htmlLower.includes('<form');
    const hasBooking = htmlLower.includes('book') || htmlLower.includes('schedule') || htmlLower.includes('appointment');
    const hasPhone = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(html);
    const score = hasForm ? (hasBooking ? 4 : 3) : hasPhone ? 2 : 1;
    results.push({
      category: 'Booking/Inquiries',
      status: tierFromScore(score),
      score,
      feedback_summary: hasForm
        ? hasBooking
          ? 'Contact/booking form detected with appointment-related content.'
          : 'Contact form found, but no booking-specific functionality detected.'
        : hasPhone
          ? 'Phone number found but no online booking/inquiry form.'
          : 'No contact form or booking system detected.',
      notes: null,
      metadata: { hasForm, hasBooking, hasPhone },
    });
  }

  // 6. Photos & Media — check image usage
  if (fetchError) {
    results.push(unreachable('Photos & Media', fetchError));
  } else {
    const imageCount = (html.match(/<img\s/gi) || []).length;
    const hasAltTags = (html.match(/alt=["'][^"']+["']/gi) || []).length;
    const hasLazyLoad = htmlLower.includes('loading="lazy"') || htmlLower.includes("loading='lazy'");
    const altRatio = imageCount > 0 ? hasAltTags / imageCount : 0;
    const score = imageCount >= 5 ? (altRatio > 0.7 ? 4 : 3) : imageCount > 0 ? 2 : 1;
    results.push({
      category: 'Photos & Media',
      status: tierFromScore(score),
      score,
      feedback_summary: imageCount >= 5
        ? `${imageCount} images found. ${Math.round(altRatio * 100)}% have alt text${hasLazyLoad ? ', lazy loading enabled' : ''}.`
        : imageCount > 0
          ? `Only ${imageCount} image(s) found. Consider adding more visual content.`
          : 'No images found on the page.',
      notes: null,
      metadata: { imageCount, hasAltTags, altRatio, hasLazyLoad },
    });
  }

  // 7. SEO Optimization — fully automatable
  if (fetchError) {
    results.push(unreachable('SEO Optimization', fetchError));
  } else {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const hasTitle = !!titleMatch && titleMatch[1].trim().length > 0;
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const hasDesc = !!descMatch && descMatch[1].trim().length > 0;
    const hasH1 = htmlLower.includes('<h1');
    const hasStructured = htmlLower.includes('application/ld+json') || htmlLower.includes('itemtype=');
    const hasCanonical = htmlLower.includes('rel="canonical"') || htmlLower.includes("rel='canonical'");

    let score = 1;
    if (hasTitle) score++;
    if (hasDesc) score++;
    if (hasH1) score++;
    if (hasStructured || hasCanonical) score++;

    results.push({
      category: 'SEO Optimization',
      status: tierFromScore(score),
      score,
      feedback_summary: [
        hasTitle ? 'Page title present' : 'Missing page title',
        hasDesc ? 'meta description present' : 'missing meta description',
        hasH1 ? 'H1 heading found' : 'no H1 heading',
        hasStructured ? 'structured data found' : 'no structured data',
      ].join(', ') + '.',
      notes: hasTitle ? `Title: "${titleMatch![1].trim().substring(0, 80)}"` : null,
      metadata: { hasTitle, hasDesc, hasH1, hasStructured, hasCanonical, title: titleMatch?.[1]?.trim() },
    });
  }

  // 8. Speed & Performance
  if (fetchError) {
    results.push(unreachable('Speed & Performance', fetchError));
  } else {
    const pageSize = html.length;
    const scriptCount = (html.match(/<script/gi) || []).length;
    const pageSizeKB = Math.round(pageSize / 1024);

    let score = 1;
    if (responseTime < 1000) score = 5;
    else if (responseTime < 2000) score = 4;
    else if (responseTime < 3000) score = 3;
    else if (responseTime < 5000) score = 2;

    // Penalize for excessive scripts or large page size
    if (scriptCount > 20) score = Math.max(1, score - 1);
    if (pageSizeKB > 500) score = Math.max(1, score - 1);

    results.push({
      category: 'Speed & Performance',
      status: tierFromScore(score),
      score,
      feedback_summary: `Response time: ${responseTime}ms. Page size: ${pageSizeKB}KB. ${scriptCount} script tags.`,
      notes: null,
      metadata: { responseTimeMs: responseTime, pageSizeKB, scriptCount },
    });
  }

  // 9. Branding Consistency — multi-page comparison
  if (fetchError) {
    results.push(unreachable('Branding Consistency', fetchError));
  } else {
    // Crawl internal pages and compare font families, CSS custom props, logo presence
    let score = 2; // Default: we can see the homepage but can't compare
    let feedbackParts: string[] = [];
    const homeCustomProps = new Set((html.match(/--[\w-]+/g) || []));
    const homeFonts = new Set(
      (html.match(/font-family\s*:\s*([^;}]+)/gi) || [])
        .map((m) => m.replace(/font-family\s*:\s*/i, '').split(',')[0].replace(/["']/g, '').trim().toLowerCase())
        .filter((f) => !['inherit', 'initial', 'unset'].includes(f))
    );
    const hasHomeLogo = htmlLower.includes('logo') || /<img[^>]*(logo|brand)[^>]*>/i.test(html);

    try {
      const internalPages = await crawlInternalPages(normalizedUrl, html, 3);

      if (internalPages.length > 0) {
        let fontConsistent = 0;
        let logoConsistent = 0;
        let tokenConsistent = 0;

        for (const page of internalPages) {
          const pageLower = page.html.toLowerCase();
          // Check font consistency
          const pageFonts = new Set(
            (page.html.match(/font-family\s*:\s*([^;}]+)/gi) || [])
              .map((m) => m.replace(/font-family\s*:\s*/i, '').split(',')[0].replace(/["']/g, '').trim().toLowerCase())
              .filter((f) => !['inherit', 'initial', 'unset'].includes(f))
          );
          const fontsMatch = [...homeFonts].every((f) => pageFonts.has(f));
          if (fontsMatch) fontConsistent++;

          // Check logo presence
          const hasPageLogo = pageLower.includes('logo') || /<img[^>]*(logo|brand)[^>]*>/i.test(page.html);
          if (hasHomeLogo && hasPageLogo) logoConsistent++;

          // Check design token usage
          const pageProps = new Set((page.html.match(/--[\w-]+/g) || []));
          const overlap = [...homeCustomProps].filter((p) => pageProps.has(p)).length;
          if (homeCustomProps.size > 0 && overlap / homeCustomProps.size > 0.5) tokenConsistent++;
        }

        const total = internalPages.length;
        const consistencyRate = Math.round(((fontConsistent + logoConsistent + tokenConsistent) / (total * 3)) * 100);

        if (consistencyRate >= 80) score = 5;
        else if (consistencyRate >= 60) score = 4;
        else if (consistencyRate >= 40) score = 3;
        else score = 2;

        feedbackParts.push(`Compared ${total} internal pages`);
        feedbackParts.push(`fonts consistent on ${fontConsistent}/${total}`);
        feedbackParts.push(`logo present on ${logoConsistent}/${total}`);
        feedbackParts.push(`design tokens consistent on ${tokenConsistent}/${total}`);
      } else {
        feedbackParts.push('Could not crawl internal pages for comparison');
        score = 2;
      }
    } catch {
      feedbackParts = ['Multi-page comparison failed'];
      score = 2;
    }

    results.push({
      category: 'Branding Consistency',
      status: tierFromScore(score),
      score,
      feedback_summary: feedbackParts.join('. ') + '.',
      notes: score <= 2 ? 'Admin review recommended — compare branding elements across key pages.' : null,
      metadata: { automatable: true, homeFonts: [...homeFonts], homeCustomPropCount: homeCustomProps.size, hasHomeLogo },
    });
  }

  // 10. Trust Signals
  if (fetchError) {
    results.push(unreachable('Trust Signals', fetchError));
  } else {
    const hasPhone = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(html);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
    const socialPlatforms = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
    const foundSocials = socialPlatforms.filter((p) => htmlLower.includes(p));
    const hasOgImage = htmlLower.includes('property="og:image"') || htmlLower.includes("property='og:image'");

    let score = 1;
    if (isHttps) score++;
    if (hasPhone || hasEmail) score++;
    if (foundSocials.length >= 2) score++;
    if (hasOgImage) score++;

    results.push({
      category: 'Trust Signals',
      status: tierFromScore(score),
      score,
      feedback_summary: [
        isHttps ? 'SSL active' : 'No SSL',
        hasPhone ? 'phone visible' : 'no phone',
        hasEmail ? 'email visible' : 'no email',
        foundSocials.length > 0 ? `${foundSocials.length} social links` : 'no social links',
      ].join(', ') + '.',
      notes: null,
      metadata: { isHttps, hasPhone, hasEmail, foundSocials, hasOgImage },
    });
  }

  return results;
}

/** Convert a 1-5 score to a status tier */
function tierFromScore(score: number): 'pass' | 'warning' | 'error' {
  if (score >= 4) return 'pass';
  if (score >= 3) return 'warning';
  return 'error';
}

/** Placeholder for categories that couldn't be analyzed */
function unreachable(category: string, error: string): WebsiteCheckResult {
  return {
    category,
    status: 'neutral',
    score: null,
    feedback_summary: 'Could not analyze — website was unreachable.',
    notes: error,
    metadata: { automatable: true, fetchFailed: true },
  };
}
