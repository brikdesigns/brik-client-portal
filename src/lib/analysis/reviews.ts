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
    status: 'error',
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
    status: 'error',
    score: 0,
    feedback_summary: 'Not found on Yelp.',
    notes: null,
    metadata: {
      searchUrl: `https://www.yelp.com/search?find_desc=${encodeURIComponent(clientName)}&find_loc=${encodeURIComponent(address || '')}`,
    },
  };
}

// ── Fallback: generate search URLs for manual verification ──────────

function generateSearchUrl(
  platform: string,
  clientName: string,
  address: string | null,
): WebsiteCheckResult {
  return {
    category: platform,
    status: 'neutral',
    score: null,
    feedback_summary: null,
    notes: 'Manual verification required. Use the search URL in metadata to check this platform.',
    metadata: {
      searchUrl: buildGenericSearchUrl(platform, clientName, address),
      manualCheck: true,
      name_on_listing: '',
      phone_listed: '',
      address_listed: '',
    },
  };
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
