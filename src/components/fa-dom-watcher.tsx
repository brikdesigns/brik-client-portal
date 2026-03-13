'use client';

import { useEffect } from 'react';
import { dom } from '@fortawesome/fontawesome-svg-core';

/**
 * Watches the DOM for <i className="fa-solid ..."> tags (used by BDS components
 * like AlertBanner) and converts them into proper FA SVGs. Uses MutationObserver
 * so dynamically rendered icons (e.g., after client-side navigation) are caught.
 * Icons must be registered in the library first (see layout.tsx).
 */
export function FADomWatcher() {
  useEffect(() => {
    dom.watch();
  }, []);

  return null;
}
