'use client';

import { ThemeProvider } from '@bds/components/providers';

export function BDSProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      initialTheme={{ themeNumber: '1' }}
      persist={false}
      applyToBody={true}
    >
      {children}
    </ThemeProvider>
  );
}
