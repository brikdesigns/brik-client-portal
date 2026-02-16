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
        'brik-text': 'var(--_color---text--primary)',
        'brik-text-secondary': 'var(--_color---text--secondary)',
        'brik-text-muted': 'var(--_color---text--muted)',
        'brik-surface': 'var(--_color---surface--primary)',
        'brik-surface-secondary': 'var(--_color---surface--secondary)',
        'brik-page': 'var(--_color---page--primary)',
        'brik-page-accent': 'var(--_color---page--accent)',
        'brik-border': 'var(--_color---border--secondary)',
        'brik-border-muted': 'var(--_color---border--muted)',
        'brik-link': 'var(--_color---system--link)',
      },
      borderColor: {
        DEFAULT: 'var(--_color---border--muted)',
      },
      fontFamily: {
        'bds-heading': 'var(--_typography---font-family--heading)',
        'bds-body': 'var(--_typography---font-family--body)',
        'bds-label': 'var(--_typography---font-family--label)',
      },
      borderRadius: {
        'bds-sm': 'var(--_border-radius---sm)',
        'bds-md': 'var(--_border-radius---md)',
        'bds-lg': 'var(--_border-radius---lg)',
      },
    },
  },
  plugins: [],
};

export default config;
