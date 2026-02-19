/**
 * Automated competitor analysis.
 *
 * Uses Google Places API to find nearby competing businesses, then runs
 * the website analyzer on each competitor's site for a /50 website score.
 * Listings/Reviews score counts how many platforms list each competitor.
 *
 * Matches the Notion "Competitors Analysis" database schema:
 * - Website Score (out of 50) — from running analyzeWebsite() on their site
 * - Listings/Reviews Score (out of 7) — count of platforms they're listed on
 * - Distance, Services Offered, competitor name in metadata
 */

import { type WebsiteCheckResult } from './website';
import { analyzeWebsite } from './website';
import type { Industry } from './report-config';

/**
 * Find and analyze 3 competitors near the client's address.
 * Returns one result per competitor slot (Competitor 1, 2, 3).
 */
export async function analyzeCompetitors(
  clientName: string,
  address: string | null,
  industry: Industry,
): Promise<WebsiteCheckResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey || !address) {
    const reason = !apiKey
      ? 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to env.'
      : 'Client address required for competitor search.';

    return [1, 2, 3].map((n) => ({
      category: `Competitor ${n}`,
      status: 'neutral' as const,
      score: null,
      feedback_summary: null,
      notes: reason,
      metadata: {
        competitor_name: '',
        distance: '',
        services_offered: '',
        website_score: null,
        website_score_explanation: '',
        listings_reviews_score: null,
        listings_review_score_explanation: '',
      },
    }));
  }

  // Step 1: Geocode the address to get lat/lng
  const coords = await geocodeAddress(address, apiKey);
  if (!coords) {
    return [1, 2, 3].map((n) => ({
      category: `Competitor ${n}`,
      status: 'neutral' as const,
      score: null,
      feedback_summary: null,
      notes: 'Could not geocode client address.',
      metadata: {
        competitor_name: '',
        distance: '',
        services_offered: '',
        website_score: null,
        website_score_explanation: '',
        listings_reviews_score: null,
        listings_review_score_explanation: '',
      },
    }));
  }

  // Step 2: Find nearby competitors
  const placeType = industryToPlaceType(industry);
  const competitors = await findNearbyCompetitors(
    coords.lat,
    coords.lng,
    placeType,
    clientName,
    apiKey,
  );

  // Step 3: Score each competitor
  const results: WebsiteCheckResult[] = [];

  for (let i = 0; i < 3; i++) {
    const competitor = competitors[i];
    const slotLabel = `Competitor ${i + 1}`;

    if (!competitor) {
      results.push({
        category: slotLabel,
        status: 'neutral',
        score: null,
        feedback_summary: null,
        notes: i === 0 ? 'No competitors found nearby.' : null,
        metadata: {
          competitor_name: '',
          distance: '',
          services_offered: '',
          website_score: null,
          website_score_explanation: '',
          listings_reviews_score: null,
          listings_review_score_explanation: '',
        },
      });
      continue;
    }

    // Get Place Details for website URL
    const details = await getPlaceDetails(competitor.place_id, apiKey);
    const distanceMi = competitor.distanceMeters
      ? `${(competitor.distanceMeters / 1609.34).toFixed(1)} mi`
      : '';

    // Score their website (/50)
    let websiteScore: number | null = null;
    let websiteExplanation = 'No website found.';

    if (details.website) {
      try {
        const websiteResults = await analyzeWebsite(details.website);
        const scored = websiteResults.filter((r) => r.score !== null);
        websiteScore = scored.reduce((sum, r) => sum + (r.score ?? 0), 0);
        const weakAreas = websiteResults.filter((r) => r.score !== null && r.score <= 2);
        websiteExplanation = weakAreas.length > 0
          ? `Weak areas: ${weakAreas.map((r) => r.category).join(', ')}.`
          : `Strong across ${scored.length} categories.`;
      } catch {
        websiteExplanation = 'Could not analyze competitor website.';
      }
    }

    // Listings/Reviews score — at minimum 1 (confirmed on Google)
    const listingsScore = 1;
    const listingsExplanation = `Confirmed on Google Maps (${competitor.rating ?? 'N/A'} rating, ${competitor.totalReviews ?? 0} reviews).`;

    results.push({
      category: slotLabel,
      status: websiteScore !== null ? 'pass' : 'neutral',
      score: websiteScore !== null ? 1 : null, // Report-level score: 1 = analyzed
      feedback_summary: `${competitor.name}: Website ${websiteScore ?? '?'}/50, Listings ${listingsScore}/7.`,
      notes: null,
      metadata: {
        competitor_name: competitor.name,
        distance: distanceMi,
        services_offered: details.types?.join(', ') ?? '',
        website_score: websiteScore,
        website_score_explanation: websiteExplanation,
        listings_reviews_score: listingsScore,
        listings_review_score_explanation: listingsExplanation,
        website_url: details.website ?? '',
        google_place_id: competitor.place_id,
        google_rating: competitor.rating,
        google_reviews: competitor.totalReviews,
      },
    });
  }

  return results;
}

// ── Google Geocoding ────────────────────────────────────────────────

interface Coords {
  lat: number;
  lng: number;
}

async function geocodeAddress(address: string, apiKey: string): Promise<Coords | null> {
  const params = new URLSearchParams({
    address,
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {
    // Geocoding failed
  }

  return null;
}

// ── Google Places Nearby Search ─────────────────────────────────────

interface NearbyCompetitor {
  place_id: string;
  name: string;
  rating: number | null;
  totalReviews: number | null;
  distanceMeters: number | null;
}

async function findNearbyCompetitors(
  lat: number,
  lng: number,
  type: string,
  excludeName: string,
  apiKey: string,
): Promise<NearbyCompetitor[]> {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '16093', // ~10 miles in meters
    type,
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await res.json();

    if (!data.results) return [];

    // Filter out the client's own business (fuzzy name match)
    const normalizedClientName = excludeName.toLowerCase().replace(/[^a-z0-9]/g, '');

    return data.results
      .filter((place: Record<string, unknown>) => {
        const placeName = ((place.name as string) ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return !placeName.includes(normalizedClientName) && !normalizedClientName.includes(placeName);
      })
      .slice(0, 5) // Take top 5 to pick best 3
      .map((place: Record<string, unknown>) => {
        // Calculate distance from client location
        const placeLat = (place.geometry as Record<string, Record<string, number>>)?.location?.lat;
        const placeLng = (place.geometry as Record<string, Record<string, number>>)?.location?.lng;
        const distanceMeters = placeLat && placeLng
          ? haversineDistance(lat, lng, placeLat, placeLng)
          : null;

        return {
          place_id: place.place_id as string,
          name: place.name as string,
          rating: (place.rating as number) ?? null,
          totalReviews: (place.user_ratings_total as number) ?? null,
          distanceMeters,
        };
      })
      .sort((a: NearbyCompetitor, b: NearbyCompetitor) => (a.distanceMeters ?? 99999) - (b.distanceMeters ?? 99999))
      .slice(0, 3); // Closest 3
  } catch {
    return [];
  }
}

// ── Google Place Details ────────────────────────────────────────────

interface PlaceDetails {
  website: string | null;
  types: string[] | null;
  phone: string | null;
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'website,types,formatted_phone_number',
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await res.json();

    if (data.result) {
      return {
        website: data.result.website ?? null,
        types: data.result.types ?? null,
        phone: data.result.formatted_phone_number ?? null,
      };
    }
  } catch {
    // Details fetch failed
  }

  return { website: null, types: null, phone: null };
}

// ── Helpers ──────────────────────────────────────────────────────────

function industryToPlaceType(industry: Industry): string {
  switch (industry) {
    case 'dental': return 'dentist';
    case 'real-estate': return 'real_estate_agency';
    default: return 'establishment';
  }
}

/** Haversine distance in meters between two lat/lng pairs */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
