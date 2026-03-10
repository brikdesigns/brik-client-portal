/**
 * Automated online reviews/listings analysis.
 *
 * Checks listing platforms for the client's business:
 * - Google: Google Places API (text search)
 * - Yelp: Yelp Fusion API (business search)
 * - Apple Maps: Google Places as proxy (if on Google, almost certainly
 *   on Apple Maps too) with a direct Apple Maps link
 * - Healthgrades, WebMD, Vitals, Facebook: Serper.dev (Google Search API)
 *   for site-scoped searches. 2,500 free queries, no credit card.
 *   Falls back to manual verification links when not configured.
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

// ── Serper.dev (Google Search API) for platforms without native APIs ─────

const PLATFORM_DOMAINS: Record<string, string> = {
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

/**
 * Check if a business is listed on a platform using Google search via Serper.dev.
 *
 * Serper.dev provides Google Search results as JSON. Free tier: 2,500 queries
 * (no credit card, no subscription). Supports site: operator for domain-scoped
 * searches. Falls back to manual verification links when not configured.
 *
 * https://serper.dev
 */
async function analyzeViaSiteSearch(
  platform: string,
  clientName: string,
  address: string | null,
): Promise<WebsiteCheckResult> {
  const domain = PLATFORM_DOMAINS[platform];
  const searchUrl = buildPlatformSearchUrl(platform, clientName, address);

  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey && domain) {
    return analyzeWithSerper(platform, clientName, address, domain, serperKey, searchUrl);
  }

  return {
    category: platform,
    status: 'neutral',
    score: null,
    feedback_summary: `Could not auto-verify ${platform} listing.`,
    notes: `Verify manually: ${searchUrl}`,
    metadata: { searchUrl, needsManualVerification: true },
  };
}

async function analyzeWithSerper(
  platform: string,
  clientName: string,
  address: string | null,
  domain: string,
  apiKey: string,
  fallbackUrl: string,
): Promise<WebsiteCheckResult> {
  // Extract city/state from address to scope results geographically
  // Prevents matching same-name businesses in wrong locations
  const locationHint = extractCityState(address);
  const query = locationHint
    ? `"${clientName}" ${locationHint} site:${domain}`
    : `"${clientName}" site:${domain}`;

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 3 }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return {
        category: platform,
        status: 'neutral',
        score: null,
        feedback_summary: `Search API error (HTTP ${res.status}).`,
        notes: `Verify manually: ${fallbackUrl}`,
        metadata: { searchUrl: fallbackUrl },
      };
    }

    const data = await res.json();
    const results = data.organic ?? [];

    // Filter results by location — reject results clearly belonging to wrong state/city
    const locationFiltered = address
      ? results.filter((r: Record<string, string>) => isResultNearLocation(r, address))
      : results;

    if (locationFiltered.length > 0) {
      const topResult = locationFiltered[0];
      const snippet = topResult.snippet ?? '';
      const title = topResult.title ?? '';
      const rating = extractRatingFromSnippet(snippet);
      const reviewCount = extractReviewCountFromSnippet(snippet);
      const extractedAddr = extractAddressFromSnippet(snippet, title);
      const extractedPhone = extractPhoneFromSnippet(snippet);

      return {
        category: platform,
        status: 'pass',
        score: 1,
        feedback_summary: `Found on ${platform}.${rating ? ` Rating: ${rating}.` : ''}${reviewCount ? ` Reviews: ${reviewCount}.` : ''}`,
        notes: null,
        metadata: {
          searchUrl: topResult.link ?? fallbackUrl,
          name_on_listing: topResult.title ?? clientName,
          phone_listed: extractedPhone,
          address_listed: extractedAddr,
          ...(rating ? { rating } : {}),
          ...(reviewCount ? { total_reviews: reviewCount } : {}),
          method: 'serper',
          totalResults: results.length,
          locationFilteredCount: locationFiltered.length,
        },
      };
    }

    // Had results but all were wrong location
    if (results.length > 0 && locationFiltered.length === 0) {
      return {
        category: platform,
        status: 'fail',
        score: 0,
        feedback_summary: `Found on ${platform} but listing is for a different location.`,
        notes: `${results.length} result(s) found but none matched the expected location. Verify manually.`,
        metadata: {
          searchUrl: fallbackUrl,
          method: 'serper',
          totalResults: results.length,
          locationFilteredCount: 0,
          rejectedLocation: true,
        },
      };
    }

    return {
      category: platform,
      status: 'fail',
      score: 0,
      feedback_summary: `Not found on ${platform}.`,
      notes: null,
      metadata: { searchUrl: fallbackUrl, method: 'serper', totalResults: 0 },
    };
  } catch {
    return {
      category: platform,
      status: 'neutral',
      score: null,
      feedback_summary: `Search timed out for ${platform}.`,
      notes: `Verify manually: ${fallbackUrl}`,
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

/**
 * Extract city and state from a US address string.
 *
 * Designed for addresses stored in our companies table, which follow
 * standard US formats:
 *   "1835 Madison St, Ste A, Clarksville, TN 37043"
 *   "123 Main St, Nashville, TN 37201"
 *   "Nashville, TN"
 *
 * Strategy: scan right-to-left for "City, ST ZIP" or "City, ST" pattern.
 * The state+zip segment is always the LAST comma-separated part,
 * and the city is always the part immediately before it.
 */
function extractCityState(address: string | null): string | null {
  if (!address) return null;

  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  // Last part should contain state abbreviation (and optional zip)
  const lastPart = parts[parts.length - 1];
  const stateMatch = lastPart.match(/^([A-Z]{2})\b/);
  if (!stateMatch) return null;

  const state = stateMatch[1];

  // Second-to-last part is the city — validate it looks like a city name
  // (letters, spaces, hyphens, periods — NOT numbers which indicate a street)
  const cityCandidate = parts[parts.length - 2];
  if (!cityCandidate || /^\d/.test(cityCandidate)) return null;

  // Additional guard: city should be mostly alphabetical (reject "Ste A", "Suite 200")
  const alphaRatio = cityCandidate.replace(/[^a-zA-Z]/g, '').length / cityCandidate.length;
  if (alphaRatio < 0.7) return null;

  return `${cityCandidate} ${state}`;
}

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

/**
 * Check if a Serper search result is geographically near the expected address.
 *
 * Strategy: extract state abbreviations from the result's title + snippet.
 * If the result mentions a US state that doesn't match the company's state,
 * reject it. This catches "Renew Dental, North Haven, CT" when we want TN.
 *
 * If no state can be determined from the result, we allow it (benefit of doubt).
 */
function isResultNearLocation(
  result: Record<string, string>,
  address: string,
): boolean {
  const expectedState = extractStateFromAddress(address);
  if (!expectedState) return true; // Can't validate, allow it

  const expectedCity = extractCityFromAddress(address)?.toLowerCase();

  const text = `${result.title ?? ''} ${result.snippet ?? ''}`;

  // Look for "City, ST" patterns in the result text
  const stateMatches = text.matchAll(/([A-Za-z\s.-]+),\s*([A-Z]{2})\b/g);
  const foundStates = new Set<string>();
  for (const m of stateMatches) {
    foundStates.add(m[2]);
  }

  // If we found state abbreviations in the result
  if (foundStates.size > 0) {
    // If our expected state is among them, it's a match
    if (foundStates.has(expectedState)) return true;
    // If only other states are mentioned, reject
    return false;
  }

  // No state found in result — check if expected city name appears
  if (expectedCity && text.toLowerCase().includes(expectedCity)) {
    return true;
  }

  // Can't determine location from result, allow it (conservative)
  return true;
}

/** Extract the 2-letter state code from a US address */
function extractStateFromAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const match = parts[i].match(/^([A-Z]{2})\b/);
    if (match) return match[1];
  }
  return null;
}

/** Extract the city name from a US address (part before state) */
function extractCityFromAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  // Find the part with the state, city is the one before it
  for (let i = parts.length - 1; i >= 1; i--) {
    if (/^[A-Z]{2}\b/.test(parts[i])) {
      const city = parts[i - 1];
      if (city && !/^\d/.test(city)) return city;
    }
  }
  return null;
}

/** Try to extract a phone number from a search snippet */
function extractPhoneFromSnippet(snippet: string): string {
  const match = snippet.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : '';
}

/** Try to extract an address from a search snippet/title */
function extractAddressFromSnippet(snippet: string, title: string): string {
  const text = `${title} ${snippet}`;
  // Look for "123 Street Name, City, ST" pattern
  const match = text.match(/\d{1,5}\s+[A-Za-z\s.]+(?:St|Ave|Blvd|Dr|Rd|Way|Ln|Ct|Pl|Pkwy|Hwy|Cir|Ter)\b[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?/i);
  return match ? match[0].trim() : '';
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
