import type { Metadata } from 'next';
import { poppins } from '@/lib/fonts';
import { BDSProvider } from '@/components/bds-provider';
import './globals.css';

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
          {children}
        </BDSProvider>
      </body>
    </html>
  );
}
