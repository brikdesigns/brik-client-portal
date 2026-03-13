/**
 * AI output validation layer.
 *
 * Every AI-generated value must pass through validation before being
 * persisted to Supabase. This prevents:
 * - Empty/undefined content silently stored as null
 * - Excessively long text from unbounded AI responses
 * - Oversized arrays (scope_items, deliverables)
 * - HTML/script injection from AI or external API data
 *
 * Usage:
 *   import { validateSection, validateScopeItem, sanitizeText } from '@/lib/ai-validation';
 */

// ── Limits ─────────────────────────────────────────────────────

/** Max characters for a single proposal section's markdown content */
const MAX_SECTION_CONTENT = 15_000;

/** Max characters for opportunities_text narrative */
const MAX_OPPORTUNITIES_TEXT = 8_000;

/** Max characters for a single string field (names, labels, timelines) */
const MAX_SHORT_TEXT = 500;

/** Max items in an array field (scope_items.included, deliverables, etc.) */
const MAX_ARRAY_ITEMS = 50;

/** Max characters per array item string */
const MAX_ARRAY_ITEM_TEXT = 1_000;

// ── Sanitization ───────────────────────────────────────────────

/** Strip HTML tags from text. Preserves markdown formatting. */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/** Sanitize a text field: strip HTML, trim, enforce max length. */
export function sanitizeText(text: string | null | undefined, maxLength = MAX_SHORT_TEXT): string {
  if (!text || typeof text !== 'string') return '';
  return stripHtml(text).trim().slice(0, maxLength);
}

/** Sanitize a markdown content field: strip script/style tags but preserve markdown HTML-like syntax. */
export function sanitizeMarkdown(content: string | null | undefined, maxLength = MAX_SECTION_CONTENT): string {
  if (!content || typeof content !== 'string') return '';
  // Remove script and style tags (including content between them)
  let clean = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove event handlers (onerror, onclick, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove iframe, object, embed tags
  clean = clean.replace(/<\s*\/?\s*(iframe|object|embed|form|input)[^>]*>/gi, '');
  return clean.trim().slice(0, maxLength);
}

/** Sanitize and limit an array of strings. */
export function sanitizeStringArray(
  arr: unknown,
  maxItems = MAX_ARRAY_ITEMS,
  maxItemLength = MAX_ARRAY_ITEM_TEXT,
): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map(item => sanitizeText(item, maxItemLength));
}

// ── Proposal Section Validation ────────────────────────────────

export interface ValidatedSection {
  type: string;
  title: string;
  content: string;
  sort_order: number;
  scope_items?: ValidatedScopeItem[];
  timeline_phases?: ValidatedTimelinePhase[];
}

export interface ValidatedScopeItem {
  service_id: string | null;
  service_name: string;
  category_slug: string;
  included: string[];
  not_included: string[];
  timeline: string | null;
}

export interface ValidatedTimelinePhase {
  phase_label: string;
  deliverables: string[];
}

/**
 * Validate a generated proposal section before persistence.
 * Throws if content is missing or empty; sanitizes all text fields.
 */
export function validateSection(section: Record<string, unknown>, sectionType: string): ValidatedSection {
  const content = section.content;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error(
      `[ai-validation] Section "${sectionType}" has no content. ` +
      `Keys: ${Object.keys(section).join(', ')}`
    );
  }

  const validated: ValidatedSection = {
    type: sectionType,
    title: sanitizeText(section.title as string, MAX_SHORT_TEXT) || sectionType,
    content: sanitizeMarkdown(content),
    sort_order: typeof section.sort_order === 'number' ? section.sort_order : 0,
  };

  if (section.scope_items && Array.isArray(section.scope_items)) {
    validated.scope_items = (section.scope_items as Record<string, unknown>[]).map(validateScopeItem);
  }

  if (section.timeline_phases && Array.isArray(section.timeline_phases)) {
    validated.timeline_phases = (section.timeline_phases as Record<string, unknown>[])
      .slice(0, MAX_ARRAY_ITEMS)
      .map(validateTimelinePhase);
  }

  return validated;
}

/** Validate a single scope item. */
export function validateScopeItem(item: Record<string, unknown>): ValidatedScopeItem {
  return {
    service_id: typeof item.service_id === 'string' ? item.service_id : null,
    service_name: sanitizeText(item.service_name as string) || 'Unknown Service',
    category_slug: sanitizeText(item.category_slug as string, 50) || 'brand',
    included: sanitizeStringArray(item.included),
    not_included: sanitizeStringArray(item.not_included),
    timeline: item.timeline && typeof item.timeline === 'string'
      ? sanitizeText(item.timeline, 200)
      : null,
  };
}

/** Validate a single timeline phase. */
export function validateTimelinePhase(phase: Record<string, unknown>): ValidatedTimelinePhase {
  return {
    phase_label: sanitizeText(phase.phase_label as string, 200) || 'Phase',
    deliverables: sanitizeStringArray(phase.deliverables, 30),
  };
}

// ── Opportunities Text Validation ──────────────────────────────

/** Sanitize opportunities narrative text before persistence. */
export function sanitizeOpportunitiesText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return sanitizeMarkdown(text, MAX_OPPORTUNITIES_TEXT);
}

// ── External API Data Sanitization ─────────────────────────────

/** Sanitize a competitor/business name from external API (Google, Yelp). */
export function sanitizeExternalName(name: string | null | undefined): string {
  return sanitizeText(name, 200);
}

// ── Generation Status Validation ───────────────────────────────

/**
 * Determine generation_status based on actual content quality, not just type count.
 * Returns 'completed' only if ALL required sections have non-empty content.
 */
export function resolveGenerationStatus(
  sections: ValidatedSection[],
  requiredTypes: string[] = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'],
): 'none' | 'pending' | 'completed' {
  if (sections.length === 0) return 'none';

  const withContent = sections.filter(s =>
    requiredTypes.includes(s.type) &&
    s.content &&
    s.content.trim().length > 0
  );

  if (withContent.length >= requiredTypes.length) return 'completed';
  if (withContent.length > 0) return 'pending';
  return 'none';
}
