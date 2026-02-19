/**
 * Automated website analysis.
 *
 * Fetches a client's website URL and checks for:
 * - SSL certificate (https)
 * - Mobile viewport meta tag
 * - Page title + meta description (SEO)
 * - Open Graph tags
 * - Response time
 * - Contact info presence (phone, email)
 * - Social media links
 */

interface WebsiteCheckResult {
  category: string;
  status: 'pass' | 'warning' | 'error' | 'neutral';
  score: number;
  feedback_summary: string;
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

  // 1. SSL Certificate
  results.push({
    category: 'SSL Certificate',
    status: isHttps ? 'pass' : 'error',
    score: isHttps ? 1 : 0,
    feedback_summary: isHttps
      ? 'Site uses HTTPS — secure connection verified.'
      : 'Site does not use HTTPS. SSL certificate is required for security and SEO.',
    notes: fetchError ? `Fetch error: ${fetchError}` : null,
    metadata: { url: normalizedUrl, isHttps },
  });

  if (fetchError) {
    // Can't analyze further if fetch failed
    const errorResult = (category: string): WebsiteCheckResult => ({
      category,
      status: 'neutral',
      score: 0,
      feedback_summary: 'Could not analyze — website was unreachable.',
      notes: fetchError,
      metadata: {},
    });
    results.push(errorResult('Mobile Responsive'));
    results.push(errorResult('Page Speed'));
    results.push(errorResult('SEO Meta Tags'));
    results.push(errorResult('Open Graph Tags'));
    results.push(errorResult('Contact Information'));
    results.push(errorResult('Social Media Links'));
    return results;
  }

  const htmlLower = html.toLowerCase();

  // 2. Mobile Responsive (viewport meta tag)
  const hasViewport = htmlLower.includes('name="viewport"') || htmlLower.includes("name='viewport'");
  results.push({
    category: 'Mobile Responsive',
    status: hasViewport ? 'pass' : 'error',
    score: hasViewport ? 1 : 0,
    feedback_summary: hasViewport
      ? 'Mobile viewport meta tag found — site should display properly on mobile.'
      : 'No viewport meta tag found. Site may not be mobile-friendly.',
    notes: null,
    metadata: { hasViewport },
  });

  // 3. Page Speed (response time)
  const speedPass = responseTime < 2000;
  const speedWarning = responseTime < 4000;
  results.push({
    category: 'Page Speed',
    status: speedPass ? 'pass' : speedWarning ? 'warning' : 'error',
    score: speedPass ? 1 : 0,
    feedback_summary: speedPass
      ? `Page loaded in ${responseTime}ms — good response time.`
      : `Page loaded in ${responseTime}ms — ${speedWarning ? 'could be faster' : 'very slow'}.`,
    notes: null,
    metadata: { responseTimeMs: responseTime },
  });

  // 4. SEO Meta Tags (title + description)
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const hasTitle = !!titleMatch && titleMatch[1].trim().length > 0;
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const hasDesc = !!descMatch && descMatch[1].trim().length > 0;
  const seoScore = (hasTitle ? 0.5 : 0) + (hasDesc ? 0.5 : 0);
  results.push({
    category: 'SEO Meta Tags',
    status: seoScore === 1 ? 'pass' : seoScore > 0 ? 'warning' : 'error',
    score: seoScore >= 0.5 ? 1 : 0,
    feedback_summary: hasTitle && hasDesc
      ? 'Page title and meta description found — good SEO foundation.'
      : hasTitle
        ? 'Page title found but meta description is missing.'
        : 'Missing page title and meta description.',
    notes: hasTitle ? `Title: "${titleMatch![1].trim().substring(0, 80)}"` : null,
    metadata: { hasTitle, hasDesc, title: titleMatch?.[1]?.trim() },
  });

  // 5. Open Graph Tags
  const hasOgTitle = htmlLower.includes('property="og:title"') || htmlLower.includes("property='og:title'");
  const hasOgImage = htmlLower.includes('property="og:image"') || htmlLower.includes("property='og:image'");
  const ogScore = (hasOgTitle ? 0.5 : 0) + (hasOgImage ? 0.5 : 0);
  results.push({
    category: 'Open Graph Tags',
    status: ogScore === 1 ? 'pass' : ogScore > 0 ? 'warning' : 'error',
    score: ogScore >= 0.5 ? 1 : 0,
    feedback_summary: hasOgTitle && hasOgImage
      ? 'Open Graph tags configured — social sharing will display properly.'
      : hasOgTitle || hasOgImage
        ? 'Partial Open Graph setup — missing ' + (!hasOgTitle ? 'og:title' : 'og:image') + '.'
        : 'No Open Graph tags found. Social media shares will lack rich previews.',
    notes: null,
    metadata: { hasOgTitle, hasOgImage },
  });

  // 6. Contact Information (phone + email patterns)
  const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasPhone = phonePattern.test(html);
  const hasEmail = emailPattern.test(html);
  const contactScore = (hasPhone ? 0.5 : 0) + (hasEmail ? 0.5 : 0);
  results.push({
    category: 'Contact Information',
    status: contactScore === 1 ? 'pass' : contactScore > 0 ? 'warning' : 'error',
    score: contactScore >= 0.5 ? 1 : 0,
    feedback_summary: hasPhone && hasEmail
      ? 'Phone and email contact information found on the page.'
      : hasPhone || hasEmail
        ? `Only ${hasPhone ? 'phone number' : 'email address'} found — add ${!hasPhone ? 'phone number' : 'email'} for better accessibility.`
        : 'No contact information (phone or email) found on the page.',
    notes: null,
    metadata: { hasPhone, hasEmail },
  });

  // 7. Social Media Links
  const socialPlatforms = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
  const foundSocials = socialPlatforms.filter((p) => htmlLower.includes(p));
  const hasSocials = foundSocials.length >= 2;
  results.push({
    category: 'Social Media Links',
    status: hasSocials ? 'pass' : foundSocials.length > 0 ? 'warning' : 'error',
    score: hasSocials ? 1 : 0,
    feedback_summary: hasSocials
      ? `Found ${foundSocials.length} social media links: ${foundSocials.map(s => s.replace('.com', '')).join(', ')}.`
      : foundSocials.length > 0
        ? `Only ${foundSocials.length} social link found. Consider adding more for broader reach.`
        : 'No social media links found on the page.',
    notes: null,
    metadata: { foundSocials },
  });

  return results;
}
