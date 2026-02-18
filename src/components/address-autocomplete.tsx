'use client';

import { useRef, useEffect, useState } from 'react';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import type { TextInputProps } from '@bds/components/ui/TextInput/TextInput';

/* ── Minimal Google Maps type declarations ─────────────────────── */

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { types?: string[]; componentRestrictions?: { country: string } }
          ) => GoogleAutocomplete;
        };
        event: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

interface GoogleAutocomplete {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => { formatted_address?: string };
}

/* ── Script loader (singleton) ─────────────────────────────────── */

let loadPromise: Promise<void> | null = null;

function loadGooglePlaces(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/* ── Component ─────────────────────────────────────────────────── */

interface AddressAutocompleteProps extends Omit<TextInputProps, 'onChange' | 'ref'> {
  value: string;
  onChange: (value: string) => void;
}

export function AddressAutocomplete({
  value,
  onChange,
  ...inputProps
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const [ready, setReady] = useState(false);

  // Load Google Places API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    loadGooglePlaces(apiKey)
      .then(() => setReady(true))
      .catch(() => {
        // Silently degrade — input still works as plain text
      });
  }, []);

  // Attach autocomplete once API is loaded and input is mounted
  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google!.maps.places.Autocomplete(
      inputRef.current,
      { types: ['address'] }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [ready, onChange]);

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      {...inputProps}
    />
  );
}
