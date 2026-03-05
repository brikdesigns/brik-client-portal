/**
 * Proposal section types and structured data shapes
 *
 * Sections are stored as JSONB in the proposals.sections column.
 * Each section has a `type` that determines its content structure:
 *
 * - overview_and_goals, why_brik: flat markdown in `content`
 * - scope_of_project: structured `scope_items` array
 * - project_timeline: structured `timeline_phases` array
 * - fee_summary: uses proposal_items table (no extra data needed)
 */

/** Base section fields shared by all types */
export interface ProposalSectionBase {
  type: string;
  title: string;
  content: string | null;
  sort_order: number;
}

/** A single service scope item within "Scope of Project" */
export interface ScopeItem {
  service_id: string | null;
  service_name: string;
  category_slug: string;
  included: string[];
  not_included: string[];
  timeline: string | null;
}

/** Scope of Project section — with structured items */
export interface ScopeOfProjectSection extends ProposalSectionBase {
  type: 'scope_of_project';
  scope_items?: ScopeItem[];
}

/** A single phase within "Project Timeline" */
export interface TimelinePhase {
  phase_label: string;
  deliverables: string[];
}

/** Project Timeline section — with structured phases */
export interface ProjectTimelineSection extends ProposalSectionBase {
  type: 'project_timeline';
  timeline_phases?: TimelinePhase[];
}

/** Fee summary item — maps to proposal_items table, enriched with category */
export interface FeeSummaryItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_cents: number;
  sort_order: number;
  service_id: string | null;
  category_slug: string | null;
}

/** Generic markdown section (overview, why_brik, etc.) */
export interface MarkdownSection extends ProposalSectionBase {
  type: 'overview_and_goals' | 'why_brik';
}

/** Fee summary section — data comes from proposal_items, not JSONB */
export interface FeeSummarySection extends ProposalSectionBase {
  type: 'fee_summary';
}

/** Union of all section types */
export type ProposalSection =
  | MarkdownSection
  | ScopeOfProjectSection
  | ProjectTimelineSection
  | FeeSummarySection
  | ProposalSectionBase; // fallback for unknown types

/** Type guard helpers */
export function isScopeSection(s: ProposalSectionBase): s is ScopeOfProjectSection {
  return s.type === 'scope_of_project';
}

export function isTimelineSection(s: ProposalSectionBase): s is ProjectTimelineSection {
  return s.type === 'project_timeline';
}

export function isMarkdownSection(s: ProposalSectionBase): boolean {
  return s.type === 'overview_and_goals' || s.type === 'why_brik';
}

export function isFeeSummarySection(s: ProposalSectionBase): boolean {
  return s.type === 'fee_summary';
}
