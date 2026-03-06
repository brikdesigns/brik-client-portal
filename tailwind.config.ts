import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './brik-bds/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brik-brand': 'var(--brand--primary)',
        'brik-accent': 'var(--brand--accent)',
        'brik-text': 'var(--text-primary)',
        'brik-text-secondary': 'var(--text-secondary)',
        'brik-text-muted': 'var(--text-muted)',
        'brik-surface': 'var(--surface-primary)',
        'brik-surface-secondary': 'var(--surface-secondary)',
        'brik-page': 'var(--page-primary)',
        'brik-page-accent': 'var(--page-accent)',
        'brik-border': 'var(--border-secondary)',
        'brik-border-muted': 'var(--border-muted)',
        'brik-link': 'var(--color-system-link)',
      },
      borderColor: {
        DEFAULT: 'var(--border-muted)',
      },
      fontFamily: {
        'bds-heading': 'var(--font-family-heading)',
        'bds-body': 'var(--font-family-body)',
        'bds-label': 'var(--font-family-label)',
      },
      borderRadius: {
        'bds-sm': 'var(--border-radius-sm)',
        'bds-md': 'var(--border-radius-md)',
        'bds-lg': 'var(--border-radius-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
