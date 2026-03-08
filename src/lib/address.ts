/**
 * Parse a US-formatted address string into structured fields.
 *
 * Handles common formats:
 *   "Street, City, ST 12345, Country"   (4+ parts, Geoapify)
 *   "Street, City, ST 12345"            (3 parts, manual entry)
 *
 * Returns null values for any field it can't extract.
 */
/**
 * Extract just the street portion from a formatted address string,
 * stripping the city, state, zip, and country that are shown separately.
 */
export function extractStreet(formatted: string): string {
  const parts = formatted.split(',').map((s) => s.trim());
  if (parts.length < 3) return formatted; // can't parse — return as-is

  const stateZipRegex = /^[A-Z]{2}\s+\d{5}(?:-\d{4})?$/;

  // 4+ parts: "Street, City, ST ZIP, Country" → street is everything before city
  if (parts.length >= 4 && stateZipRegex.test(parts[parts.length - 2])) {
    return parts.slice(0, parts.length - 3).join(', ');
  }

  // 3 parts: "Street, City, ST ZIP" → street is everything before city
  if (stateZipRegex.test(parts[parts.length - 1])) {
    return parts.slice(0, parts.length - 2).join(', ');
  }

  return formatted;
}

export function parseAddressString(formatted: string): {
  city: string | null;
  state: string | null;
  postalCode: string | null;
} {
  const parts = formatted.split(',').map((s) => s.trim());
  if (parts.length < 3) return { city: null, state: null, postalCode: null };

  const stateZipRegex = /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;

  // Try second-to-last part first (4+ part format with country)
  let match = parts[parts.length - 2].match(stateZipRegex);
  if (match) {
    return {
      city: parts[parts.length - 3] ?? null,
      state: match[1],
      postalCode: match[2],
    };
  }

  // Try last part (3-part format without country)
  match = parts[parts.length - 1].match(stateZipRegex);
  if (match) {
    return {
      city: parts[parts.length - 2] ?? null,
      state: match[1],
      postalCode: match[2],
    };
  }

  return { city: null, state: null, postalCode: null };
}
