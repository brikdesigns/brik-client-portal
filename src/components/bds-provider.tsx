'use client';

import { ThemeProvider } from '@bds/components/providers';

/**
 * BDS component provider — decoupled from template themes.
 *
 * The portal uses the Brik Designs company brand (poppy red, Poppins, etc.),
 * NOT any of the 8 BDS web template themes. Template themes (theme-1 through
 * theme-8) are a product offering for the Brik web store.
 *
 * applyToBody={false} prevents ThemeProvider from adding a theme-X class to
 * <body>. This avoids BDS theme-specific CSS rules (e.g. @media 1440px
 * .body.theme-1 spacious spacing) from overriding our brand tokens. Brand
 * tokens are defined in globals.css on the .body selector.
 *
 * ThemeProvider is kept for React context (in case BDS components use
 * useTheme()). The themeNumber value doesn't affect styling since
 * applyToBody is false.
 */
export function BDSProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      initialTheme={{ themeNumber: '1' }}
      persist={false}
      applyToBody={false}
    >
      {children}
    </ThemeProvider>
  );
}
