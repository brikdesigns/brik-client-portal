/**
 * BDS Token Reference for Portal Development
 *
 * Maps Figma style names → CSS custom property strings.
 * Source of truth: brik-bds/tokens/TOKEN-REFERENCE.md + Style Dictionary output.
 *
 * WHY THIS EXISTS:
 * Figma shows "body/md · 16/150" but code needs "var(--_typography---body--md-base)".
 * This file makes that conversion instant — import and use, no guessing.
 *
 * USAGE:
 *   import { font, color, space, gap, radius, border } from '@/lib/tokens';
 *   style={{ fontSize: font.size.body.md, color: color.text.primary }}
 *
 * DO NOT hardcode px values or hex colors. If a token is missing, add it here
 * and reference the BDS TOKEN-REFERENCE.md for the correct variable name.
 */

// ─── Typography ──────────────────────────────────────────────────────

export const font = {
  family: {
    body: 'var(--_typography---font-family--body)',
    heading: 'var(--_typography---font-family--heading)',
    label: 'var(--_typography---font-family--label)',
    display: 'var(--_typography---font-family--display)',
  },

  /**
   * Font sizes — maps to Figma typography styles
   *
   * Figma style        → Token                              → Resolved (Base)
   * ─────────────────────────────────────────────────────────────────────────
   * body/tiny           → --_typography---body--tiny          → 10.26px
   * body/xs             → --_typography---body--xs            → 11.54px
   * body/sm (14/150)    → --_typography---body--sm            → 14px
   * body/md (16/150)    → --_typography---body--md-base       → 16px
   * body/lg (18/150)    → --_typography---body--lg            → 18px
   * body/xl (20/150)    → --_typography---body--xl            → 20px
   * label/sm            → --_typography---label--sm           → 14px
   * label/md            → --_typography---label--md-base      → 16px
   * label/lg            → --_typography---label--lg           → 18px
   * label/xl            → --_typography---label--xl           → 20px
   * subtitle/md         → label--sm + weight 600 + uppercase (composite)
   * heading/tiny        → --_typography---heading--tiny       → 16px
   * heading/small       → --_typography---heading--small      → 20px
   * heading/medium      → --_typography---heading--medium     → 25.3px
   * heading/large       → --_typography---heading--large      → 32px
   */
  size: {
    body: {
      tiny: 'var(--_typography---body--tiny)',
      xs: 'var(--_typography---body--xs)',
      sm: 'var(--_typography---body--sm)',
      md: 'var(--_typography---body--md-base)',
      lg: 'var(--_typography---body--lg)',
      xl: 'var(--_typography---body--xl)',
    },
    label: {
      sm: 'var(--_typography---label--sm)',
      md: 'var(--_typography---label--md-base)',
      lg: 'var(--_typography---label--lg)',
      xl: 'var(--_typography---label--xl)',
    },
    heading: {
      tiny: 'var(--_typography---heading--tiny)',
      small: 'var(--_typography---heading--small)',
      medium: 'var(--_typography---heading--medium)',
      large: 'var(--_typography---heading--large)',
      xLarge: 'var(--_typography---heading--x-large)',
      xxLarge: 'var(--_typography---heading--xx-large)',
      xxxLarge: 'var(--_typography---heading--xxx-large)',
    },
    icon: {
      sm: 'var(--_typography---icon--small)',
      md: 'var(--_typography---icon--medium-base)',
      lg: 'var(--_typography---icon--large)',
    },
  },

  lineHeight: {
    none: 'var(--font-line-height--none)',
    tight: 'var(--font-line-height--100)',
    snug: 'var(--font-line-height--125)',
    normal: 'var(--font-line-height--150)',
    relaxed: 'var(--font-line-height--175)',
    loose: 'var(--font-line-height--200)',
  },

  weight: {
    light: 300 as const,
    regular: 400 as const,
    medium: 500 as const,
    semibold: 600 as const,
    bold: 700 as const,
  },
} as const;

// ─── Colors ──────────────────────────────────────────────────────────

export const color = {
  text: {
    primary: 'var(--_color---text--primary)',
    secondary: 'var(--_color---text--secondary)',
    muted: 'var(--_color---text--muted)',
    brand: 'var(--_color---text--brand)',
    inverse: 'var(--_color---text--inverse)',
  },
  surface: {
    primary: 'var(--_color---surface--primary)',
    secondary: 'var(--_color---surface--secondary)',
    brandPrimary: 'var(--_color---surface--brand-primary)',
  },
  background: {
    primary: 'var(--_color---background--primary)',
    secondary: 'var(--_color---background--secondary)',
    brandPrimary: 'var(--_color---background--brand-primary)',
    inverse: 'var(--_color---background--inverse)',
    input: 'var(--_color---background--input)',
  },
  border: {
    primary: 'var(--_color---border--primary)',
    secondary: 'var(--_color---border--secondary)',
    muted: 'var(--_color---border--muted)',
    brand: 'var(--_color---border--brand)',
    input: 'var(--_color---border--input)',
    inverse: 'var(--_color---border--inverse)',
  },
  page: {
    primary: 'var(--_color---page--primary)',
    secondary: 'var(--_color---page--secondary)',
  },
  system: {
    link: 'var(--_color---system--link)',
    red: 'var(--system--red)',
    green: 'var(--system--green)',
    yellow: 'var(--system--yellow)',
    blue: 'var(--system--blue)',
    orange: 'var(--system--orange)',
  },
} as const;

// ─── Spacing (Padding) ──────────────────────────────────────────────

export const space = {
  none: 'var(--_space---none)',
  tiny: 'var(--_space---tiny)',
  xs: 'var(--_space---xs)',
  sm: 'var(--_space---sm)',
  md: 'var(--_space---md)',
  lg: 'var(--_space---lg)',
  xl: 'var(--_space---xl)',
  huge: 'var(--_space---huge)',
  button: 'var(--_space---button)',
  input: 'var(--_space---input)',
} as const;

// ─── Gap (between elements) ─────────────────────────────────────────

export const gap = {
  none: 'var(--_space---gap--none)',
  tiny: 'var(--_space---gap--tiny)',
  xs: 'var(--_space---gap--xs)',
  sm: 'var(--_space---gap--sm)',
  md: 'var(--_space---gap--md)',
  lg: 'var(--_space---gap--lg)',
  xl: 'var(--_space---gap--xl)',
  huge: 'var(--_space---gap--huge)',
} as const;

// ─── Border ──────────────────────────────────────────────────────────

export const border = {
  width: {
    none: 'var(--_border-width---none)',
    sm: 'var(--_border-width---sm)',
    md: 'var(--_border-width---md)',
    lg: 'var(--_border-width---lg)',
  },
  radius: {
    none: 'var(--_border-radius---none)',
    sm: 'var(--_border-radius---sm)',
    md: 'var(--_border-radius---md)',
    lg: 'var(--_border-radius---lg)',
    button: 'var(--_border-radius---button)',
    input: 'var(--_border-radius---input)',
    pill: 'var(--border-radius--pill)',
    circle: 'var(--border-radius--circle)',
  },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────

export const shadow = {
  none: 'var(--_box-shadow---none)',
  sm: 'var(--_box-shadow---sm)',
  md: 'var(--_box-shadow---md)',
  lg: 'var(--_box-shadow---lg)',
} as const;
