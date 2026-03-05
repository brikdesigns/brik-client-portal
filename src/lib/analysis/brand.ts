/**
 * Automated brand/logo analysis.
 *
 * Evaluates a client's website across 10 categories matching the Notion
 * "Brand/Logo Report" database. Most categories are auto-scored from
 * HTML/CSS analysis; only Signage (physical) remains truly manual.
 *
 * Categories (scored 1-5, max 50):
 * 1. Logo Usage — partial auto
 * 2. Logo Consistency — auto (multi-page comparison)
 * 3. Logo Legibility — auto (format + sizing heuristics)
 * 4. Color Palette — auto
 * 5. Typography — auto
 * 6. Photography & Imagery — auto
 * 7. Brand Voice & Messaging — auto (text tone analysis)
 * 8. Social Media Branding — auto
 * 9. Signage & Onsite Branding — manual (physical)
 * 10. Overall Brand Cohesion — auto (composite of other scores)
 */

import { type WebsiteCheckResult } from './website';
import { extractVisibleText, fleschKincaid, crawlInternalPages } from './html-utils';

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

  // 2. Logo Consistency — multi-page comparison
  // (crawl happens here; results cached for #10 Overall Brand Cohesion)
  let internalPages: Array<{ url: string; html: string }> = [];
  if (!fetchError) {
    try {
      internalPages = await crawlInternalPages(normalizedUrl, html, 3);
    } catch {
      // Crawl failed — will fall back to homepage-only analysis
    }
  }

  if (fetchError) {
    results.push(unreachable('Logo Consistency', fetchError));
  } else {
    const homeHasLogo = htmlLower.includes('logo') || /<img[^>]*(logo|brand)[^>]*>/i.test(html);

    if (internalPages.length > 0) {
      let pagesWithLogo = 0;
      for (const page of internalPages) {
        const pageLower = page.html.toLowerCase();
        if (pageLower.includes('logo') || /<img[^>]*(logo|brand)[^>]*>/i.test(page.html)) {
          pagesWithLogo++;
        }
      }
      const total = internalPages.length;
      const rate = pagesWithLogo / total;
      const score = rate >= 1 ? 5 : rate >= 0.75 ? 4 : rate >= 0.5 ? 3 : homeHasLogo ? 2 : 1;

      results.push({
        category: 'Logo Consistency',
        status: tierFromScore(score),
        score,
        feedback_summary: `Logo present on ${pagesWithLogo}/${total} internal pages checked${homeHasLogo ? ' (plus homepage)' : ''}.`,
        notes: null,
        metadata: { automatable: true, pagesChecked: total, pagesWithLogo, homeHasLogo },
      });
    } else {
      results.push({
        category: 'Logo Consistency',
        status: tierFromScore(homeHasLogo ? 3 : 1),
        score: homeHasLogo ? 3 : 1,
        feedback_summary: homeHasLogo
          ? 'Logo found on homepage. Could not crawl internal pages for full comparison.'
          : 'No logo detected on homepage.',
        notes: homeHasLogo ? 'Score based on homepage only — admin can adjust after reviewing other pages.' : null,
        metadata: { automatable: true, homeHasLogo, pagesChecked: 0 },
      });
    }
  }

  // 3. Logo Legibility — format and sizing heuristics
  if (fetchError) {
    results.push(unreachable('Logo Legibility', fetchError));
  } else {
    const hasSvgLogo = /<svg[^>]*>[\s\S]*?<\/svg>/i.test(html) && (htmlLower.includes('logo') || htmlLower.includes('brand'));
    const logoImgs = html.match(/<img[^>]*(logo|brand)[^>]*>/gi) || [];
    const hasRetina = logoImgs.some((img) => /srcset|2x/i.test(img));
    const hasLargeFormat = logoImgs.some((img) => /\.(svg|webp|png)/i.test(img));
    const hasFavicon = htmlLower.includes('rel="icon"') || htmlLower.includes("rel='icon'");
    const hasAppleTouchIcon = htmlLower.includes('rel="apple-touch-icon"');

    let score = 1;
    if (hasSvgLogo) score = 5; // SVG = infinitely scalable = best legibility
    else if (hasRetina && hasLargeFormat) score = 4;
    else if (hasLargeFormat) score = 3;
    else if (logoImgs.length > 0) score = 2;
    // Bonus for multi-size support
    if (score >= 3 && hasFavicon && hasAppleTouchIcon) score = Math.min(5, score + 1);

    const parts: string[] = [];
    if (hasSvgLogo) parts.push('SVG logo (scalable at any size)');
    else if (logoImgs.length > 0) parts.push(`${logoImgs.length} raster logo image(s)`);
    else parts.push('no logo image detected');
    if (hasRetina) parts.push('retina-ready');
    if (hasFavicon) parts.push('favicon present');
    if (hasAppleTouchIcon) parts.push('Apple touch icon');

    results.push({
      category: 'Logo Legibility',
      status: tierFromScore(score),
      score,
      feedback_summary: parts.join(', ') + '.',
      notes: score <= 2 ? 'Consider using SVG format for crisp display at all sizes.' : null,
      metadata: { automatable: true, hasSvgLogo, logoImgCount: logoImgs.length, hasRetina, hasLargeFormat, hasFavicon, hasAppleTouchIcon },
    });
  }

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

  // 7. Brand Voice & Messaging — text tone analysis
  if (fetchError) {
    results.push(unreachable('Brand Voice & Messaging', fetchError));
  } else {
    const visibleText = extractVisibleText(html);
    const readability = fleschKincaid(visibleText);
    const textLower = visibleText.toLowerCase();

    // Check for first-person voice ("we", "our") — signals brand personality
    const weCount = (textLower.match(/\bwe\b/g) || []).length;
    const ourCount = (textLower.match(/\bour\b/g) || []).length;
    const youCount = (textLower.match(/\byou\b/g) || []).length;
    const hasFirstPerson = weCount + ourCount > 3;
    const hasSecondPerson = youCount > 3;

    // Check for mission/value keywords
    const missionKeywords = ['mission', 'values', 'believe', 'committed', 'dedicated', 'passion', 'excellence', 'quality', 'trusted'];
    const foundMissionWords = missionKeywords.filter((k) => textLower.includes(k));

    // Check for unique value proposition signals
    const uvpKeywords = ['unique', 'different', 'unlike', 'only', 'exclusive', 'specialized', 'leading', 'premier', 'best'];
    const foundUvpWords = uvpKeywords.filter((k) => textLower.includes(k));

    let score = 1;
    if (hasFirstPerson && hasSecondPerson) score++; // Conversational tone
    if (foundMissionWords.length >= 2) score++; // Clear values
    if (foundUvpWords.length >= 1) score++; // Value proposition present
    if (readability.score >= 50 && readability.words >= 200) score++; // Readable, substantial content
    score = Math.min(5, score);

    const parts: string[] = [];
    if (hasFirstPerson) parts.push(`first-person voice (${weCount + ourCount} uses of "we/our")`);
    if (hasSecondPerson) parts.push(`addresses visitor (${youCount} uses of "you")`);
    if (foundMissionWords.length > 0) parts.push(`mission language: ${foundMissionWords.slice(0, 3).join(', ')}`);
    if (foundUvpWords.length > 0) parts.push(`differentiator language: ${foundUvpWords.slice(0, 3).join(', ')}`);
    if (parts.length === 0) parts.push('limited brand personality signals in text content');

    results.push({
      category: 'Brand Voice & Messaging',
      status: tierFromScore(score),
      score,
      feedback_summary: parts.join('. ') + '.',
      notes: readability.words < 100 ? 'Very little text detected — page may rely on images or JS rendering.' : null,
      metadata: {
        automatable: true,
        readabilityScore: readability.score,
        wordCount: readability.words,
        weOurCount: weCount + ourCount,
        youCount,
        missionKeywords: foundMissionWords,
        uvpKeywords: foundUvpWords,
      },
    });
  }

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

  // 10. Overall Brand Cohesion — computed from other auto-scored categories
  {
    const scoredResults = results.filter((r) => r.score !== null);
    if (scoredResults.length >= 3) {
      const avgScore = scoredResults.reduce((sum, r) => sum + (r.score ?? 0), 0) / scoredResults.length;
      const score = Math.min(5, Math.max(1, Math.round(avgScore)));
      const lowCategories = scoredResults.filter((r) => (r.score ?? 0) <= 2).map((r) => r.category);

      results.push({
        category: 'Overall Brand Cohesion',
        status: tierFromScore(score),
        score,
        feedback_summary: lowCategories.length > 0
          ? `Average brand score: ${avgScore.toFixed(1)}/5. Weakest areas: ${lowCategories.join(', ')}.`
          : `Average brand score: ${avgScore.toFixed(1)}/5. Brand elements are cohesive across analyzed categories.`,
        notes: 'Composite score derived from other brand categories. Admin can adjust based on overall impression.',
        metadata: { automatable: true, averageScore: avgScore, scoredCategoryCount: scoredResults.length, lowCategories },
      });
    } else {
      results.push({
        category: 'Overall Brand Cohesion',
        status: 'neutral',
        score: null,
        feedback_summary: 'Not enough auto-scored categories to compute a composite score.',
        notes: 'Score other categories first, or assign manually.',
        metadata: { automatable: false },
      });
    }
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
