import type { Metadata } from 'next';
import { config, library } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { poppins } from '@/lib/fonts';
import { BDSProvider } from '@/components/bds-provider';
import { FADomWatcher } from '@/components/fa-dom-watcher';
import { validateEnv } from '@/lib/env';
import './globals.css';

// Prevent FA from injecting CSS at runtime — we import it above so it's SSR'd
config.autoAddCss = false;

// Register icons used by BDS components via <i className="fa-solid ..."> tags
// so FA SVG core can replace them with proper SVGs at runtime
library.add(faCircleInfo, faTriangleExclamation);

// Fail fast if critical env vars are missing
validateEnv();

export const metadata: Metadata = {
  title: 'Brik Client Portal',
  description: 'Brik Designs client portal — track your projects, billing, and metrics.',
};

/**
 * Anti-FOUC script — runs synchronously in <head> before first paint.
 * Adopted from brikdesigns.com (header.css / header-scripts.js).
 *
 * Priority: localStorage('theme') → OS prefers-color-scheme → 'light'
 * Sets data-theme and color-scheme on <html> immediately.
 */
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`body ${poppins.variable} ${poppins.className}`}>
        <BDSProvider>
          <FADomWatcher />
          {children}
        </BDSProvider>
      </body>
    </html>
  );
}
