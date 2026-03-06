'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { font, color, space, border, shadow } from '@/lib/tokens';

/**
 * Geoapify autocomplete result
 */
interface GeoapifyResult {
  formatted: string;
  lat: number;
  lon: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface GeoapifyResponse {
  results: GeoapifyResult[];
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: GeoapifyResult) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  required?: boolean;
}

/**
 * Debounce helper for address search
 */
function useDebouncedFetch(
  callback: (text: string) => void,
  delay: number
): (text: string) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (text: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(text), delay);
    },
    [callback, delay]
  );
}

/**
 * Dropdown styles using BDS tokens
 */
const dropdownStyles = {
  container: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    marginTop: space.tiny,
    backgroundColor: color.background.input,
    border: `${border.width.sm} solid ${color.border.input}`,
    borderRadius: border.radius.input,
    boxShadow: shadow.md,
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  item: {
    padding: `${space.md} ${space.lg}`,
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.primary,
    cursor: 'pointer',
    borderBottom: `${border.width.sm} solid ${color.border.secondary}`,
    transition: 'background-color 0.15s',
  },
  itemHover: {
    backgroundColor: color.surface.secondary,
  },
};

/**
 * AddressAutocomplete — BDS-styled address input with Geoapify geocoding
 *
 * Uses Geoapify's free autocomplete API (3,000 requests/day).
 * Falls back to plain TextInput if NEXT_PUBLIC_GEOAPIFY_API_KEY is not set.
 *
 * Token reference:
 * - All dropdown styles use BDS tokens for colors, spacing, typography
 * - Input field inherits TextInput's full token system
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label,
  placeholder,
  fullWidth,
  required,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Geoapify
  const fetchSuggestions = useDebouncedFetch(async (text: string) => {
    if (!apiKey || text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        text,
        apiKey,
        limit: '5',
        format: 'json',
        filter: 'countrycode:us',
      });

      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
      );

      if (!res.ok) return;

      const data: GeoapifyResponse = await res.json();
      setSuggestions(data.results || []);
      setIsOpen((data.results || []).length > 0);
    } catch {
      // Silently degrade — input still works as plain text
    }
  }, 300);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    onChange(text);
    fetchSuggestions(text);
  }

  function handleSelect(result: GeoapifyResult) {
    onChange(result.formatted);
    onSelect?.(result);
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoveredIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoveredIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && hoveredIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[hoveredIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <TextInput
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        autoComplete="off"
        required={required}
        fullWidth={fullWidth}
      />
      {isOpen && suggestions.length > 0 && (
        <div style={dropdownStyles.container}>
          {suggestions.map((result, index) => (
            <div
              key={`${result.lat}-${result.lon}`}
              style={{
                ...dropdownStyles.item,
                ...(index === hoveredIndex ? dropdownStyles.itemHover : {}),
                ...(index === suggestions.length - 1
                  ? { borderBottom: 'none' }
                  : {}),
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                handleSelect(result);
              }}
            >
              {result.formatted}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
