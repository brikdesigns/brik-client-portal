/**
 * Automated online reviews/listings analysis.
 *
 * Checks listing platforms for the client's business:
 * - Google: Google Places API (text search)
 * - Yelp: Yelp Fusion API (business search)
 * - Healthgrades, WebMD, Vitals, Facebook: Google Custom Search API
 *   (searches site:platform.com for the business name — bypasses bot
 *   protection and JS rendering that break direct scraping)
 * - Apple Maps: Google Places as proxy (if on Google, almost certainly
 *   on Apple Maps too) with a direct Apple Maps link
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
        case 'Facebook':
          result = await analyzeViaSiteSearch(platform, clientName, address);
          break;
        case 'Apple Maps':
          result = await analyzeAppleMaps(clientName, address);
          break;
        default:
          result = await analyzeViaSiteSearch(platform, clientName, address);
          break;
      }
    } catch {
      result = {
        category: platform,
        status: 'neutral',
        score: null,
        feedback_summary: `Analysis failed for ${platform}.`,
        notes: null,
        metadata: { searchUrl: buildPlatformSearchUrl(platform, clientName, address) },
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
        phone_listed: '',
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

// ── Google Custom Search (Healthgrades, Vitals, WebMD, Facebook, etc.) ──

/**
 * Use Google Custom Search API to check if a business is listed on a platform.
 * Searches for: "business name" site:platform.com
 *
 * This is far more reliable than scraping because:
 * 1. No bot protection issues (it's Google's own API)
 * 2. Works for JS-rendered SPAs (Google has already indexed the content)
 * 3. Consistent, structured results
 *
 * Falls back to a neutral "not verified" if Custom Search is not configured.
 */
async function analyzeViaSiteSearch(
  platform: string,
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  // Custom Search API needs its own key — falls back to Places key if not set
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  const platformDomains: Record<string, string> = {
    'Healthgrades': 'healthgrades.com',
    'WebMD': 'doctor.webmd.com',
    'Vitals': 'vitals.com',
    'Facebook': 'facebook.com',
    'Zillow': 'zillow.com',
    'Realtor.com': 'realtor.com',
    'TripAdvisor': 'tripadvisor.com',
    'Airbnb': 'airbnb.com',
    'Vrbo': 'vrbo.com',
    'Booking.com': 'booking.com',
  };

  const domain = platformDomains[platform];
  const searchUrl = buildPlatformSearchUrl(platform, clientName, address);

  // Use Google Custom Search if configured (most reliable)
  if (apiKey && searchEngineId && domain) {
    return analyzeWithCustomSearch(platform, clientName, domain, apiKey, searchEngineId, searchUrl);
  }

  // No Custom Search configured — return neutral with manual link
  return {
    category: platform,
    status: 'neutral',
    score: null,
    feedback_summary: `Add GOOGLE_CUSTOM_SEARCH_ENGINE_ID to env for automated ${platform} verification.`,
    notes: `Search manually: ${searchUrl}`,
    metadata: { searchUrl, apiKeyMissing: true },
  };
}

async function analyzeWithCustomSearch(
  platform: string,
  clientName: string,
  domain: string,
  apiKey: string,
  searchEngineId: string,
  fallbackUrl: string,
): Promise<WebsiteCheckResult> {
  const query = `"${clientName}" site:${domain}`;
  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: query,
    num: '3',
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!res.ok) {
      return {
        category: platform,
        status: 'neutral',
        score: null,
        feedback_summary: `Google Custom Search API error (HTTP ${res.status}).`,
        notes: `Search manually: ${fallbackUrl}`,
        metadata: { searchUrl: fallbackUrl },
      };
    }

    const data = await res.json();
    const totalResults = parseInt(data.searchInformation?.totalResults ?? '0', 10);

    if (totalResults > 0 && data.items && data.items.length > 0) {
      const topResult = data.items[0];
      const snippet = topResult.snippet ?? '';
      const rating = extractRatingFromSnippet(snippet);
      const reviewCount = extractReviewCountFromSnippet(snippet);

      return {
        category: platform,
        status: 'pass',
        score: 1,
        feedback_summary: `Found on ${platform}.${rating ? ` Rating: ${rating}.` : ''}${reviewCount ? ` Reviews: ${reviewCount}.` : ''}`,
        notes: null,
        metadata: {
          searchUrl: topResult.link ?? fallbackUrl,
          name_on_listing: topResult.title ?? clientName,
          phone_listed: '',
          address_listed: '',
          ...(rating ? { rating } : {}),
          ...(reviewCount ? { total_reviews: reviewCount } : {}),
          method: 'google_custom_search',
          totalResults,
        },
      };
    }

    return {
      category: platform,
      status: 'fail',
      score: 0,
      feedback_summary: `Not found on ${platform}.`,
      notes: null,
      metadata: { searchUrl: fallbackUrl, method: 'google_custom_search', totalResults: 0 },
    };
  } catch {
    return {
      category: platform,
      status: 'neutral',
      score: null,
      feedback_summary: `Search timed out for ${platform}.`,
      notes: `Search manually: ${fallbackUrl}`,
      metadata: { searchUrl: fallbackUrl },
    };
  }
}

// ── Apple Maps ─────────────────────────────────────────────────────────

/**
 * Apple Maps has no public search API. We use Google Places as a proxy:
 * if the business is on Google Maps, it's almost certainly on Apple Maps.
 */
async function analyzeAppleMaps(
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = encodeURIComponent(clientName + (address ? ' ' + address : ''));
  const appleMapsUrl = `https://maps.apple.com/?q=${query}`;

  if (!apiKey) {
    return {
      category: 'Apple Maps',
      status: 'neutral',
      score: null,
      feedback_summary: null,
      notes: 'Apple Maps has no public API. Add GOOGLE_PLACES_API_KEY to infer listing.',
      metadata: { searchUrl: appleMapsUrl, apiKeyMissing: true },
    };
  }

  const params = new URLSearchParams({
    query: address ? `${clientName} ${address}` : clientName,
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          category: 'Apple Maps',
          status: 'pass',
          score: 1,
          feedback_summary: 'Business confirmed on Google Maps — Apple Maps listing inferred.',
          notes: null,
          metadata: {
            searchUrl: appleMapsUrl,
            method: 'google_places_proxy',
            name_on_listing: data.results[0].name ?? '',
            phone_listed: '',
            address_listed: data.results[0].formatted_address ?? '',
          },
        };
      }
    }
  } catch {
    // Fall through to neutral
  }

  return {
    category: 'Apple Maps',
    status: 'neutral',
    score: null,
    feedback_summary: 'Could not verify Apple Maps listing.',
    notes: `Open in Apple Maps: ${appleMapsUrl}`,
    metadata: { searchUrl: appleMapsUrl },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function extractRatingFromSnippet(snippet: string): number | null {
  const match = snippet.match(
    /(?:rating|score|stars?)["\s:=]*(\d+\.?\d*)(?:\s*(?:out of|\/)\s*5)?/i,
  );
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 5) return val;
  }
  return null;
}

function extractReviewCountFromSnippet(snippet: string): number | null {
  const match = snippet.match(/(\d[\d,]*)\s*(?:reviews?|ratings?|patient\s*reviews?)/i);
  if (match) {
    const val = parseInt(match[1].replace(/,/g, ''), 10);
    if (val > 0 && val < 1_000_000) return val;
  }
  return null;
}

function buildPlatformSearchUrl(platform: string, name: string, address: string | null): string {
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
