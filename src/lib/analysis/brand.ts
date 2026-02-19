/**
 * Automated brand/logo analysis.
 *
 * Evaluates a client's website across 10 categories matching the Notion
 * "Brand/Logo Report" database. Some categories can be auto-scored from
 * HTML/CSS; others require manual visual assessment.
 *
 * Categories (scored 1-5, max 50):
 * 1. Logo Usage — partial auto
 * 2. Logo Consistency — manual
 * 3. Logo Legibility — manual
 * 4. Color Palette — auto
 * 5. Typography — auto
 * 6. Photography & Imagery — auto
 * 7. Brand Voice & Messaging — manual
 * 8. Social Media Branding — auto
 * 9. Signage & Onsite Branding — manual
 * 10. Overall Brand Cohesion — manual
 */

import { type WebsiteCheckResult } from './website';

export async function analyzeBrand(url: string): Promise<WebsiteCheckResult[]> {
  const results: WebsiteCheckResult[] = [];

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let html = '';
  let fetchError: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BrikPortal/1.0 (Marketing Analysis)' },
      redirect: 'follow',
    });

    clearTimeout(timeout);
    html = await res.text();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to fetch';
  }

  const htmlLower = fetchError ? '' : html.toLowerCase();

  // 1. Logo Usage — detect logo elements in HTML
  if (fetchError) {
    results.push(unreachable('Logo Usage', fetchError));
  } else {
    const logoImgs = (html.match(/<img[^>]*(logo|brand)[^>]*>/gi) || []).length;
    const hasSvgLogo = /<svg[^>]*>[\s\S]*?<\/svg>/i.test(html) && (htmlLower.includes('logo') || htmlLower.includes('brand'));
    const hasFavicon = htmlLower.includes('rel="icon"') || htmlLower.includes("rel='icon'")
      || htmlLower.includes('rel="shortcut icon"');
    const hasAppleTouchIcon = htmlLower.includes('rel="apple-touch-icon"');

    let score = 1;
    if (logoImgs > 0 || hasSvgLogo) score = 3;
    if ((logoImgs > 0 || hasSvgLogo) && hasFavicon) score = 4;
    if ((logoImgs > 0 || hasSvgLogo) && hasFavicon && hasAppleTouchIcon) score = 5;

    results.push({
      category: 'Logo Usage',
      status: tierFromScore(score),
      score,
      feedback_summary: [
        logoImgs > 0 ? `${logoImgs} logo image(s) found` : hasSvgLogo ? 'SVG logo detected' : 'No logo image detected',
        hasFavicon ? 'favicon present' : 'no favicon',
        hasAppleTouchIcon ? 'Apple touch icon present' : null,
      ].filter(Boolean).join(', ') + '.',
      notes: null,
      metadata: { logoImgs, hasSvgLogo, hasFavicon, hasAppleTouchIcon },
    });
  }

  // 2. Logo Consistency — requires multi-page comparison
  results.push({
    category: 'Logo Consistency',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires visual comparison of logo usage across multiple pages.',
    metadata: { automatable: false },
  });

  // 3. Logo Legibility — visual judgment
  results.push({
    category: 'Logo Legibility',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires visual assessment of logo clarity at different sizes.',
    metadata: { automatable: false },
  });

  // 4. Color Palette — extract CSS colors
  if (fetchError) {
    results.push(unreachable('Color Palette', fetchError));
  } else {
    // Extract colors from inline styles and style tags
    const hexColors = new Set<string>();
    const rgbColors = new Set<string>();
    const cssCustomProps = new Set<string>();

    // Hex colors
    const hexMatches = html.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    for (const h of hexMatches) {
      hexColors.add(h.toLowerCase());
    }

    // RGB/RGBA
    const rgbMatches = html.match(/rgba?\([^)]+\)/gi) || [];
    for (const r of rgbMatches) {
      rgbColors.add(r.toLowerCase());
    }

    // CSS custom properties (signals a design system)
    const propMatches = html.match(/--[\w-]+/g) || [];
    for (const p of propMatches) {
      cssCustomProps.add(p);
    }

    const totalUniqueColors = hexColors.size + rgbColors.size;
    const hasCustomProperties = cssCustomProps.size > 5;

    let score = 1;
    if (hasCustomProperties && totalUniqueColors < 15) score = 5;
    else if (hasCustomProperties) score = 4;
    else if (totalUniqueColors < 10) score = 3;
    else if (totalUniqueColors < 20) score = 2;

    results.push({
      category: 'Color Palette',
      status: tierFromScore(score),
      score,
      feedback_summary: `${totalUniqueColors} unique colors detected. ${hasCustomProperties ? `${cssCustomProps.size} CSS custom properties found (signals systematic design).` : 'No CSS custom properties — colors may be hardcoded.'}`,
      notes: null,
      metadata: { hexColorCount: hexColors.size, rgbColorCount: rgbColors.size, cssCustomPropCount: cssCustomProps.size, totalUniqueColors },
    });
  }

  // 5. Typography — extract font families
  if (fetchError) {
    results.push(unreachable('Typography', fetchError));
  } else {
    const fontFamilies = new Set<string>();

    // From font-family declarations
    const fontMatches = html.match(/font-family\s*:\s*([^;}]+)/gi) || [];
    for (const fm of fontMatches) {
      const value = fm.replace(/font-family\s*:\s*/i, '').trim();
      // Extract first font name (before comma)
      const primaryFont = value.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (primaryFont && !['inherit', 'initial', 'unset'].includes(primaryFont)) {
        fontFamilies.add(primaryFont);
      }
    }

    const hasGoogleFonts = htmlLower.includes('fonts.googleapis.com');
    const hasAdobeFonts = htmlLower.includes('use.typekit.net') || htmlLower.includes('fonts.adobe.com');
    const hasFontFace = htmlLower.includes('@font-face');
    const hasWebFont = hasGoogleFonts || hasAdobeFonts || hasFontFace;

    let score = 1;
    if (fontFamilies.size <= 3 && hasWebFont) score = 4;
    else if (fontFamilies.size <= 3) score = 3;
    else if (fontFamilies.size <= 5) score = 2;

    // Bonus for very clean typography (1-2 fonts + webfont)
    if (fontFamilies.size <= 2 && hasWebFont) score = 5;

    results.push({
      category: 'Typography',
      status: tierFromScore(score),
      score,
      feedback_summary: `${fontFamilies.size} font ${fontFamilies.size === 1 ? 'family' : 'families'} detected${hasWebFont ? ' with web font loading' : ' (no web fonts)'}. ${fontFamilies.size > 3 ? 'Consider reducing for consistency.' : 'Good typographic discipline.'}`,
      notes: fontFamilies.size > 0 ? `Fonts: ${[...fontFamilies].join(', ')}` : null,
      metadata: { fontFamilies: [...fontFamilies], hasGoogleFonts, hasAdobeFonts, hasFontFace },
    });
  }

  // 6. Photography & Imagery — same checks as website.ts
  if (fetchError) {
    results.push(unreachable('Photography & Imagery', fetchError));
  } else {
    const imageCount = (html.match(/<img\s/gi) || []).length;
    const hasAltTags = (html.match(/alt=["'][^"']+["']/gi) || []).length;
    const hasLazyLoad = htmlLower.includes('loading="lazy"') || htmlLower.includes("loading='lazy'");
    const altRatio = imageCount > 0 ? hasAltTags / imageCount : 0;

    let score = 1;
    if (imageCount >= 5 && altRatio > 0.7) score = 4;
    else if (imageCount >= 5) score = 3;
    else if (imageCount > 0) score = 2;

    if (imageCount >= 10 && altRatio > 0.8 && hasLazyLoad) score = 5;

    results.push({
      category: 'Photography & Imagery',
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

  // 7. Brand Voice & Messaging — requires reading comprehension
  results.push({
    category: 'Brand Voice & Messaging',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires manual assessment of tone, messaging consistency, and brand personality.',
    metadata: { automatable: false },
  });

  // 8. Social Media Branding — check for social links
  if (fetchError) {
    results.push(unreachable('Social Media Branding', fetchError));
  } else {
    const socialPlatforms = [
      { name: 'Facebook', pattern: 'facebook.com' },
      { name: 'Instagram', pattern: 'instagram.com' },
      { name: 'Twitter/X', pattern: /(?:twitter\.com|x\.com)/ },
      { name: 'LinkedIn', pattern: 'linkedin.com' },
      { name: 'YouTube', pattern: 'youtube.com' },
      { name: 'TikTok', pattern: 'tiktok.com' },
    ];

    const foundPlatforms = socialPlatforms.filter((p) =>
      typeof p.pattern === 'string' ? htmlLower.includes(p.pattern) : p.pattern.test(htmlLower)
    );

    let score = 1;
    if (foundPlatforms.length >= 4) score = 5;
    else if (foundPlatforms.length >= 3) score = 4;
    else if (foundPlatforms.length >= 2) score = 3;
    else if (foundPlatforms.length >= 1) score = 2;

    results.push({
      category: 'Social Media Branding',
      status: tierFromScore(score),
      score,
      feedback_summary: foundPlatforms.length > 0
        ? `${foundPlatforms.length} social platform links found: ${foundPlatforms.map((p) => p.name).join(', ')}.`
        : 'No social media links detected on the website.',
      notes: null,
      metadata: { foundPlatforms: foundPlatforms.map((p) => p.name), totalFound: foundPlatforms.length },
    });
  }

  // 9. Signage & Onsite Branding — physical assessment
  results.push({
    category: 'Signage & Onsite Branding',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Requires physical assessment of signage and in-office branding.',
    metadata: { automatable: false },
  });

  // 10. Overall Brand Cohesion — subjective composite
  results.push({
    category: 'Overall Brand Cohesion',
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: fetchError ? `Could not fetch website: ${fetchError}` : 'Subjective assessment of overall brand consistency across all touchpoints.',
    metadata: { automatable: false },
  });

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
