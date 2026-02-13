'use client';

import { useState, useEffect } from 'react';

/**
 * Theme toggle — switches between light and dark mode.
 *
 * Adopted from brikdesigns.com theme switcher pattern:
 *   - data-theme attribute on <html>
 *   - localStorage persistence
 *   - CSS color-scheme property
 *   - Dispatches 'themechange' custom event
 *
 * The anti-FOUC script in layout.tsx sets the initial theme before
 * first paint, so this component reads from the DOM on mount.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read initial theme from DOM (set by anti-FOUC script)
    const current = document.documentElement.dataset.theme as 'light' | 'dark';
    if (current) setTheme(current);
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);

    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem('theme', next);

    window.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: next } })
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: '1px solid var(--_color---border--secondary, #e0e0e0)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: 'var(--_color---text--secondary, #828282)',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {theme === 'light' ? (
        // Moon icon — click to switch to dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon — click to switch to light
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
