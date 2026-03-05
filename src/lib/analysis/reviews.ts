/**
 * Automated online reviews/listings analysis.
 *
 * Checks listing platforms for the client's business. Uses Google Places API
 * and Yelp Fusion API when keys are available; generates search URLs for
 * platforms without API access.
 *
 * Matches the Notion "Online Listings & Reviews" database schema:
 * - Score: 1 (listed) or 0 (not listed)
 * - Rating, Total Reviews, Name on Listing, Phone, Address in metadata
 */

import { type WebsiteCheckResult } from './website';

/**
 * Analyze online review listings for a business.
 * Returns one result per platform.
 */
export async function analyzeReviews(
  clientName: string,
  address: string | null,
  platforms: string[],
): Promise<WebsiteCheckResult[]> {
  const results: WebsiteCheckResult[] = [];

  for (const platform of platforms) {
    let result: WebsiteCheckResult;

    try {
      switch (platform) {
        case 'Google':
          result = await analyzeGoogle(clientName, address);
          break;
        case 'Yelp':
          result = await analyzeYelp(clientName, address);
          break;
        case 'Healthgrades':
        case 'WebMD':
        case 'Vitals':
          result = await scrapeDirectoryListing(
            platform,
            buildGenericSearchUrl(platform, clientName, address),
            clientName,
          );
          break;
        case 'Facebook':
          result = await scrapeFacebook(clientName, address);
          break;
        case 'Apple Maps':
          result = generatePlatformFallback(
            'Apple Maps',
            clientName,
            address,
            'Apple Maps has no public search API.',
          );
          break;
        default:
          result = generateSearchUrl(platform, clientName, address);
          break;
      }
    } catch {
      result = {
        category: platform,
        status: 'neutral',
        score: null,
        feedback_summary: `Analysis failed for ${platform}.`,
        notes: null,
        metadata: { searchUrl: buildGenericSearchUrl(platform, clientName, address) },
      };
    }

    results.push(result);
  }

  return results;
}

// ── Google Places API ──────────────────────────────────────────────

async function analyzeGoogle(
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      category: 'Google',
      status: 'neutral',
      score: null,
      feedback_summary: null,
      notes: 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to env.',
      metadata: {
        searchUrl: `https://www.google.com/maps/search/${encodeURIComponent(clientName + ' ' + (address || ''))}`,
        apiKeyMissing: true,
      },
    };
  }

  const query = address ? `${clientName} ${address}` : clientName;
  const params = new URLSearchParams({
    query,
    key: apiKey,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
    { signal: AbortSignal.timeout(10000) },
  );

  if (!res.ok) {
    return {
      category: 'Google',
      status: 'neutral',
      score: null,
      feedback_summary: 'Google Places API request failed.',
      notes: `HTTP ${res.status}`,
      metadata: { searchUrl: `https://www.google.com/maps/search/${encodeURIComponent(query)}` },
    };
  }

  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const place = data.results[0];
    return {
      category: 'Google',
      status: 'pass',
      score: 1,
      feedback_summary: `Listed on Google Maps. Rating: ${place.rating ?? 'N/A'}, Reviews: ${place.user_ratings_total ?? 0}.`,
      notes: null,
      metadata: {
        name_on_listing: place.name ?? '',
        phone_listed: '', // Not in Text Search — would need Place Details
        address_listed: place.formatted_address ?? '',
        rating: place.rating ?? null,
        total_reviews: place.user_ratings_total ?? null,
        place_id: place.place_id,
        searchUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      },
    };
  }

  return {
    category: 'Google',
    status: 'fail',
    score: 0,
    feedback_summary: 'Not found on Google Maps.',
    notes: null,
    metadata: {
      searchUrl: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    },
  };
}

// ── Yelp Fusion API ────────────────────────────────────────────────

async function analyzeYelp(
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  const apiKey = process.env.YELP_FUSION_API_KEY;

  if (!apiKey) {
    return {
      category: 'Yelp',
      status: 'neutral',
      score: null,
      feedback_summary: null,
      notes: 'Yelp Fusion API key not configured. Add YELP_FUSION_API_KEY to env.',
      metadata: {
        searchUrl: `https://www.yelp.com/search?find_desc=${encodeURIComponent(clientName)}&find_loc=${encodeURIComponent(address || '')}`,
        apiKeyMissing: true,
      },
    };
  }

  const params = new URLSearchParams({
    term: clientName,
    limit: '1',
  });
  if (address) params.set('location', address);

  const res = await fetch(
    `https://api.yelp.com/v3/businesses/search?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!res.ok) {
    return {
      category: 'Yelp',
      status: 'neutral',
      score: null,
      feedback_summary: 'Yelp API request failed.',
      notes: `HTTP ${res.status}`,
      metadata: {
        searchUrl: `https://www.yelp.com/search?find_desc=${encodeURIComponent(clientName)}`,
      },
    };
  }

  const data = await res.json();

  if (data.businesses && data.businesses.length > 0) {
    const biz = data.businesses[0];
    return {
      category: 'Yelp',
      status: 'pass',
      score: 1,
      feedback_summary: `Listed on Yelp. Rating: ${biz.rating ?? 'N/A'}, Reviews: ${biz.review_count ?? 0}.`,
      notes: null,
      metadata: {
        name_on_listing: biz.name ?? '',
        phone_listed: biz.phone ?? '',
        address_listed: biz.location?.display_address?.join(', ') ?? '',
        rating: biz.rating ?? null,
        total_reviews: biz.review_count ?? null,
        yelp_id: biz.id,
        url: biz.url ?? '',
        searchUrl: biz.url ?? '',
      },
    };
  }

  return {
    category: 'Yelp',
    status: 'fail',
    score: 0,
    feedback_summary: 'Not found on Yelp.',
    notes: null,
    metadata: {
      searchUrl: `https://www.yelp.com/search?find_desc=${encodeURIComponent(clientName)}&find_loc=${encodeURIComponent(address || '')}`,
    },
  };
}

// ── Directory scraping (Healthgrades, WebMD, Vitals) ─────────────────

const SCRAPE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Attempt to fetch a directory search page and determine if the business
 * is listed by looking for the full business name (or significant phrases)
 * in the returned HTML. Falls back gracefully if the request fails or the
 * site blocks automated access.
 */
async function scrapeDirectoryListing(
  platform: string,
  searchUrl: string,
  clientName: string,
): Promise<WebsiteCheckResult> {
  try {
    const res = await fetch(searchUrl, {
      headers: SCRAPE_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return generatePlatformFallback(platform, clientName, null, `HTTP ${res.status}`);
    }

    const html = await res.text();
    const found = businessNameInHtml(clientName, html);

    if (found) {
      // Try to extract rating/review count from the raw HTML
      const rating = extractRating(html);
      const reviewCount = extractReviewCount(html);

      return {
        category: platform,
        status: 'pass',
        score: 1,
        feedback_summary: `Found on ${platform}.${rating ? ` Rating: ${rating}.` : ''}${reviewCount ? ` Reviews: ${reviewCount}.` : ''}`,
        notes: null,
        metadata: {
          searchUrl,
          automated: true,
          name_on_listing: clientName,
          phone_listed: '',
          address_listed: '',
          ...(rating ? { rating } : {}),
          ...(reviewCount ? { total_reviews: reviewCount } : {}),
        },
      };
    }

    return {
      category: platform,
      status: 'fail',
      score: 0,
      feedback_summary: `Not found on ${platform}.`,
      notes: null,
      metadata: { searchUrl, automated: true },
    };
  } catch {
    return generatePlatformFallback(platform, clientName, null, 'Request timed out or was blocked');
  }
}

/**
 * Check if the business name (or a significant multi-word phrase) appears
 * in the HTML. Requires at least a 2-word consecutive match to avoid
 * false positives (e.g. "dental" appearing on a healthcare directory).
 */
function businessNameInHtml(clientName: string, html: string): boolean {
  const htmlLower = html.toLowerCase();
  const nameLower = clientName.toLowerCase();

  // Full name match — best signal
  if (htmlLower.includes(nameLower)) return true;

  // Try 2-word consecutive phrases from the name
  const words = nameLower.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 2) {
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (htmlLower.includes(phrase)) return true;
    }
  }

  return false;
}

function extractRating(html: string): number | null {
  // Common patterns: "4.8 out of 5", "rating: 4.8", data-rating="4.8"
  const match = html.match(
    /(?:rating|score|stars?)["\s:=]*(\d+\.?\d*)(?:\s*(?:out of|\/)\s*5)?/i,
  );
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 5) return val;
  }
  return null;
}

function extractReviewCount(html: string): number | null {
  const match = html.match(/(\d[\d,]*)\s*(?:reviews?|ratings?|patient\s*reviews?)/i);
  if (match) {
    const val = parseInt(match[1].replace(/,/g, ''), 10);
    if (val > 0 && val < 1_000_000) return val;
  }
  return null;
}

// ── Facebook ─────────────────────────────────────────────────────────

async function scrapeFacebook(
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  // Facebook blocks unauthenticated search requests, but we can try
  // fetching a likely page URL slug (e.g. /MemphisDentalStudio)
  const slug = clientName.replace(/[^a-zA-Z0-9]/g, '');
  const profileUrl = `https://www.facebook.com/${slug}`;

  try {
    const res = await fetch(profileUrl, {
      headers: SCRAPE_HEADERS,
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });

    if (res.ok) {
      const html = await res.text();
      // Facebook returns a page even for 404s — check for the business name
      if (businessNameInHtml(clientName, html) && !html.includes('page_not_found')) {
        return {
          category: 'Facebook',
          status: 'pass',
          score: 1,
          feedback_summary: 'Found on Facebook.',
          notes: null,
          metadata: {
            searchUrl: profileUrl,
            automated: true,
            name_on_listing: clientName,
            phone_listed: '',
            address_listed: '',
          },
        };
      }
    }
  } catch {
    // Expected — Facebook often blocks server-side requests
  }

  return generatePlatformFallback('Facebook', clientName, address, 'Facebook requires authentication for search.');
}

// ── Fallback helpers ─────────────────────────────────────────────────

/**
 * Produce a clear fallback result when automated analysis isn't possible.
 * Unlike the old "manual verification required" message, this includes
 * the reason and a direct search link.
 */
function generatePlatformFallback(
  platform: string,
  clientName: string,
  address: string | null,
  reason: string,
): WebsiteCheckResult {
  const searchUrl = buildGenericSearchUrl(platform, clientName, address);
  return {
    category: platform,
    status: 'neutral',
    score: null,
    feedback_summary: `Could not auto-verify ${platform} listing. ${reason}`,
    notes: `Search manually: ${searchUrl}`,
    metadata: {
      searchUrl,
      manualCheck: true,
      name_on_listing: '',
      phone_listed: '',
      address_listed: '',
    },
  };
}

function generateSearchUrl(
  platform: string,
  clientName: string,
  address: string | null,
): WebsiteCheckResult {
  return generatePlatformFallback(platform, clientName, address, 'No automated check available for this platform.');
}

function buildGenericSearchUrl(platform: string, name: string, address: string | null): string {
  const query = encodeURIComponent(name + (address ? ' ' + address : ''));

  const urls: Record<string, string> = {
    'Healthgrades': `https://www.healthgrades.com/search?query=${encodeURIComponent(name)}`,
    'WebMD': `https://doctor.webmd.com/results?query=${encodeURIComponent(name)}`,
    'Vitals': `https://www.vitals.com/search?q=${encodeURIComponent(name)}`,
    'Facebook': `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name)}`,
    'Apple Maps': `https://maps.apple.com/?q=${query}`,
    'Zillow': `https://www.zillow.com/professionals/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
    'Realtor.com': `https://www.realtor.com/realestateagents/${encodeURIComponent(name)}`,
    'TripAdvisor': `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name)}`,
    'Airbnb': `https://www.airbnb.com/s/${encodeURIComponent(name)}/homes`,
    'Vrbo': `https://www.vrbo.com/search?q=${encodeURIComponent(name)}`,
    'Booking.com': `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name)}`,
  };

  return urls[platform] || `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + platform)}`;
}
