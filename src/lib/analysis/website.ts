/**
 * Automated website analysis.
 *
 * Evaluates a client's website across 10 categories matching the Notion
 * "Website Report" database. Some categories can be partially auto-scored
 * from HTML; others require manual assessment.
 *
 * Categories (scored 1-5, max 50):
 * 1. Overall Design — manual
 * 2. Mobile Responsiveness — partial auto
 * 3. Navigation — partial auto
 * 4. Content Clarity — manual
 * 5. Booking/Inquiries — partial auto
 * 6. Photos & Media — partial auto
 * 7. SEO Optimization — auto
 * 8. Speed & Performance — partial auto
 * 9. Branding Consistency — manual
 * 10. Trust Signals — auto
 */

export interface WebsiteCheckResult {
  category: string;
  status: 'pass' | 'warning' | 'error' | 'neutral';
  score: number | null;
  feedback_summary: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

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

  // 1. Overall Design — requires visual assessment, cannot auto-score
  results.push({
    category: 'Overall Design',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires manual visual assessment.',
    metadata: { automatable: false },
  });

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

  // 4. Content Clarity — manual assessment
  results.push({
    category: 'Content Clarity',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires manual content review.',
    metadata: { automatable: false },
  });

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

  // 9. Branding Consistency — manual assessment
  results.push({
    category: 'Branding Consistency',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires visual comparison across multiple pages.',
    metadata: { automatable: false },
  });

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
