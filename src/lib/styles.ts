/**
 * Shared Style Presets
 *
 * Composable CSSProperties objects built from BDS tokens.
 * Import these instead of writing inline token references manually.
 *
 * USAGE:
 *   import { text, heading, label, meta, list } from '@/lib/styles';
 *   <p style={text.body}>...</p>
 *   <h2 style={heading.section}>...</h2>
 *   <p style={meta.label}>LABEL</p>
 *   <p style={meta.value}>Value</p>
 *
 * COMPOSING:
 *   <p style={{ ...text.body, color: color.text.muted }}>Override one prop</p>
 *
 * These map directly to Figma typography styles. See tokens.ts for the
 * Figma style name → CSS variable mapping table.
 */

import type { CSSProperties } from 'react';
import { font, color, space, gap } from './tokens';

// ─── Body Text ───────────────────────────────────────────────────────

export const text = {
  /** body/md · 16/150 — default body text */
  body: {
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    lineHeight: font.lineHeight.normal,
    color: color.text.primary,
  } satisfies CSSProperties,

  /** body/sm · 14/150 — secondary body text */
  bodySmall: {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    lineHeight: font.lineHeight.normal,
    color: color.text.secondary,
  } satisfies CSSProperties,

  /** body/xs · 11.5/150 — fine print, timestamps */
  bodyXs: {
    fontFamily: font.family.body,
    fontSize: font.size.body.xs,
    lineHeight: font.lineHeight.normal,
    color: color.text.muted,
  } satisfies CSSProperties,

  /** body/md muted — descriptive text, notes */
  muted: {
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    lineHeight: font.lineHeight.normal,
    color: color.text.secondary,
  } satisfies CSSProperties,
} as const;

// ─── Headings ────────────────────────────────────────────────────────

export const heading = {
  /** Page-level heading (heading/large · 32px) */
  page: {
    fontFamily: font.family.heading,
    fontSize: font.size.heading.large,
    fontWeight: font.weight.semibold,
    lineHeight: font.lineHeight.snug,
    color: color.text.primary,
    margin: 0,
  } satisfies CSSProperties,

  /** Section heading inside a card (body/lg · 18px semibold) */
  section: {
    fontFamily: font.family.heading,
    fontSize: font.size.body.lg,
    fontWeight: font.weight.semibold,
    color: color.text.primary,
    margin: `0 0 ${space.md}`,
  } satisfies CSSProperties,

  /** Sub-section heading (body/md · 16px semibold) */
  subsection: {
    fontFamily: font.family.heading,
    fontSize: font.size.body.md,
    fontWeight: font.weight.semibold,
    color: color.text.primary,
    margin: `${space.md} 0 ${gap.sm}`,
  } satisfies CSSProperties,
} as const;

// ─── Labels (subtitle/md pattern) ────────────────────────────────────

export const label = {
  /** subtitle/md — uppercase label (Figma "subtitle/md") */
  subtitle: {
    fontFamily: font.family.label,
    fontSize: font.size.label.sm,
    fontWeight: font.weight.semibold,
    color: color.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } satisfies CSSProperties,

  /** Standard label (label/sm · 14px) */
  sm: {
    fontFamily: font.family.label,
    fontSize: font.size.label.sm,
    fontWeight: font.weight.semibold,
    color: color.text.primary,
  } satisfies CSSProperties,

  /** Label/md (16px) */
  md: {
    fontFamily: font.family.label,
    fontSize: font.size.label.md,
    fontWeight: font.weight.medium,
    color: color.text.primary,
  } satisfies CSSProperties,
} as const;

// ─── Meta (label + value pairs) ──────────────────────────────────────

export const meta = {
  /** Meta label — uppercase, muted (used in detail pages) */
  label: {
    ...label.subtitle,
    margin: `0 0 ${gap.xs}`,
  } satisfies CSSProperties,

  /** Meta value — body text below a label */
  value: {
    ...text.body,
    margin: 0,
  } satisfies CSSProperties,
} as const;

// ─── Lists ───────────────────────────────────────────────────────────

export const list = {
  /** Standard unordered list container */
  ul: {
    margin: `0 0 ${gap.md}`,
    paddingLeft: space.lg,
    listStyleType: 'disc',
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    lineHeight: font.lineHeight.normal,
    color: color.text.secondary,
  } satisfies CSSProperties,

  /** Standard list item (fontSize: inherit overrides BDS webflow.css li{font-size:14px}) */
  li: {
    fontSize: 'inherit',
    marginBottom: gap.xs,
  } satisfies CSSProperties,
} as const;
