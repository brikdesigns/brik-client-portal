/**
 * AI-powered proposal generation using Claude API.
 * Combines discovery call meeting notes + service catalog data
 * with Sandler tactics and StoryBrand messaging to generate
 * a 5-section proposal.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

export interface ServiceDetail {
  id: string;
  name: string;
  description: string | null;
  proposal_copy: string | null;
  contract_copy: string | null;
  included_scope: string | null;
  not_included: string | null;
  projected_timeline: string | null;
  base_price_cents: number;
  billing_frequency: string | null;
  category_name: string | null;
  category_slug: string | null;
}

export interface ProposalGenerationInput {
  companyName: string;
  companyIndustry: string | null;
  contactName: string;
  meetingNotes: string;
  services: ServiceDetail[];
}

import type { ScopeItem, TimelinePhase } from './proposal-types';

export interface GeneratedSection {
  type: string;
  title: string;
  content: string;
  sort_order: number;
  scope_items?: ScopeItem[];
  timeline_phases?: TimelinePhase[];
}

export interface GeneratedSections {
  overview_and_goals: GeneratedSection;
  scope_of_project: GeneratedSection;
  project_timeline: GeneratedSection;
  why_brik: GeneratedSection;
}

const SYSTEM_PROMPT = `You are a proposal writer for Brik Designs, a design and marketing agency based in Palm Beach, Florida. You write proposals that combine two proven sales frameworks:

## Sandler Selling Methodology
- Reference specific pains uncovered in the discovery call — don't generalize
- Quantify revenue impact where possible (e.g., "missed recall patients represent $X in lost production")
- Frame solutions as resolving their stated pains, not as features
- Use their own words back to them when describing problems
- Don't sell — solve. The proposal should feel like a plan, not a pitch

## StoryBrand Framework
- The CLIENT is the hero of this story, not Brik
- Brik is the GUIDE who has a plan to help them succeed
- Clearly identify the PROBLEM (external, internal, philosophical)
- Present the PLAN (clear steps they can follow)
- Call to ACTION (what accepting this proposal means)
- Paint SUCCESS (what their business looks like after working with Brik)
- Warn of FAILURE (what happens if they continue doing nothing — gently, not fear-based)

## Brik Voice
- Warm, optimistic, confident but never pushy
- "Here's what we offer. Here's what it costs. If we're a fit, amazing. If not, that's okay too."
- Use first person plural ("we") for Brik, second person ("you", "your") for the client
- No pressure tactics, no urgency manipulation
- Professional but approachable — like talking to a trusted advisor
- Use clear, simple language. Avoid jargon.

## Formatting Rules
- Write in markdown format
- Use ## for subsection headings within each section
- Use bullet lists (- ) for lists of items
- Use **bold** for emphasis on key phrases
- Keep paragraphs short (2-3 sentences max)
- Use line breaks between paragraphs for readability`;

function buildUserPrompt(input: ProposalGenerationInput): string {
  const servicesBlock = input.services.map(s => {
    const price = (s.base_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const freq = s.billing_frequency === 'recurring' ? '/month' : 'one-time';
    return `### ${s.name} (${s.category_name || 'General'})
- **Service ID**: ${s.id}
- **Category Slug**: ${s.category_slug || 'brand'}
- **Price**: ${price} ${freq}
- **Proposal Copy**: ${s.proposal_copy || s.description || 'No description available'}
- **Included Scope**: ${s.included_scope || 'Standard scope'}
- **Not Included**: ${s.not_included || 'N/A'}
- **Projected Timeline**: ${s.projected_timeline || 'TBD'}`;
  }).join('\n\n');

  return `Generate a 4-section proposal for the following client. Return ONLY valid JSON matching the exact schema below.

## Client Information
- **Company**: ${input.companyName}
- **Industry**: ${input.companyIndustry || 'Not specified'}
- **Primary Contact**: ${input.contactName}

## Discovery Call Meeting Notes
${input.meetingNotes}

## Selected Services
${servicesBlock}

## Required Output Schema
Return a JSON object with exactly 4 keys. Each section has "title" and "content" (markdown). The scope_of_project and project_timeline sections also include structured data arrays.

{
  "overview_and_goals": {
    "title": "Overview and Goals",
    "content": "Markdown content here..."
  },
  "scope_of_project": {
    "title": "Scope of Project",
    "content": "Markdown summary of overall scope...",
    "scope_items": [
      {
        "service_name": "Exact service name from Selected Services above",
        "service_id": "service UUID from above",
        "category_slug": "brand|marketing|information|product|service",
        "included": ["Deliverable 1", "Deliverable 2"],
        "not_included": ["Exclusion 1", "Exclusion 2"],
        "timeline": "2 weeks"
      }
    ]
  },
  "project_timeline": {
    "title": "Project Timeline",
    "content": "Markdown overview of the timeline...",
    "timeline_phases": [
      {
        "phase_label": "Phase 01: Discovery & Foundation",
        "deliverables": ["Activity 1", "Activity 2"]
      }
    ]
  },
  "why_brik": {
    "title": "Why Brik?",
    "content": "Markdown content here..."
  }
}

CRITICAL CONSTRAINT: The scope_items array MUST contain EXACTLY ${input.services.length} items — one for each selected service listed above. Do NOT add, remove, or substitute any services. Do NOT infer additional services from the meeting notes. Use the EXACT service_name and service_id values from the Selected Services section above. The category_slug must be one of: brand, marketing, information, product, service.

ALLOWED service_ids: ${input.services.map(s => s.id).join(', ')}
ALLOWED service_names: ${input.services.map(s => s.name).join(', ')}

## Section-Specific Instructions

### 1. Overview and Goals
- Open by acknowledging the client's current situation using details from the meeting notes
- Identify their key pain points (use their own words where possible)
- State what success looks like for them (from their stated goals)
- Include a "Our goal is simple" subsection with a bullet list of 4-6 specific, measurable objectives
- Close with a brief statement framing this proposal as the plan to get there
- Length: 3-5 paragraphs + bullet list

### 2. Scope of Project
- For EACH selected service, write a subsection with:
  - A brief description of what's included (synthesized from proposal_copy and included_scope)
  - A "Deliverables" bullet list of specific outputs
  - The projected timeline
  - What's NOT included (from not_included field), framed constructively
- Open with a brief summary paragraph tying all services together
- Length: varies by number of services

### 3. Project Timeline
- Organize the selected services into logical phases:
  - Phase 1 should be foundational work (branding, website, initial setup)
  - Phase 2 should be ongoing/recurring services
  - Phase 3 should be optimization and growth
- For each phase use format: "**Phase N (Timeline): Phase Name**"
- Each phase gets a brief description + bullet list of activities
- Include a note about client involvement requirements
- Length: 3-5 phases

### 4. Why Brik?
- Open with the StoryBrand "problem" — what most agencies get wrong
- Position Brik as the guide: "We work differently"
- Describe the Brik approach specific to their industry and pain points
- Include a bullet list of 4-6 concrete ways Brik addresses their specific concerns
- Close with the Brik voice: honest, no pressure, focused on long-term fit
- Reference their specific situation from meeting notes (don't write generic copy)
- Length: 5-7 paragraphs + bullet list`;
}

/** Validation result from scope_items guardrail. */
export interface ScopeItemsValidationResult {
  scopeItems: ScopeItem[];
  warnings: string[];
}

/**
 * Validate AI-generated scope_items against the selected services.
 * Pure function — no side effects, fully testable.
 *
 * Guardrails:
 * 1. Filters out hallucinated services not in the selected set
 * 2. Corrects service_id when AI used wrong UUID but name matches
 * 3. Backfills stub items for any selected services the AI missed
 * 4. Returns warnings for every correction (logged by caller)
 */
export function validateScopeItems(
  rawItems: Partial<ScopeItem>[],
  selectedServices: Pick<ServiceDetail, 'id' | 'name' | 'category_slug' | 'included_scope' | 'not_included' | 'projected_timeline'>[],
): ScopeItemsValidationResult {
  const warnings: string[] = [];
  const selectedById = new Set(selectedServices.map(s => s.id));
  const selectedByName = new Map(selectedServices.map(s => [s.name.toLowerCase(), s]));

  // Normalize raw items
  const normalized: ScopeItem[] = rawItems.map(item => ({
    service_id: item.service_id || null,
    service_name: item.service_name || 'Unknown Service',
    category_slug: item.category_slug || 'brand',
    included: Array.isArray(item.included) ? item.included : [],
    not_included: Array.isArray(item.not_included) ? item.not_included : [],
    timeline: item.timeline || null,
  }));

  // Filter to only selected services. Try matching by ID first, then by name.
  const matchedIds = new Set<string>();
  const scopeItems: ScopeItem[] = [];

  for (const item of normalized) {
    if (item.service_id && selectedById.has(item.service_id)) {
      matchedIds.add(item.service_id);
      scopeItems.push(item);
    } else {
      // Fallback: match by name (AI sometimes uses wrong UUID)
      const byName = selectedByName.get(item.service_name.toLowerCase());
      if (byName && !matchedIds.has(byName.id)) {
        warnings.push(`Corrected service_id for "${item.service_name}": AI returned "${item.service_id}", expected "${byName.id}"`);
        item.service_id = byName.id;
        matchedIds.add(byName.id);
        scopeItems.push(item);
      } else {
        warnings.push(`Removed hallucinated service: "${item.service_name}" (id: ${item.service_id}) — not in selected set`);
      }
    }
  }

  // Backfill any selected services the AI missed entirely
  for (const svc of selectedServices) {
    if (!matchedIds.has(svc.id)) {
      warnings.push(`Backfilled missing service: "${svc.name}" (id: ${svc.id}) — AI omitted it`);
      scopeItems.push({
        service_id: svc.id,
        service_name: svc.name,
        category_slug: svc.category_slug || 'brand',
        included: svc.included_scope ? [svc.included_scope] : [],
        not_included: svc.not_included ? [svc.not_included] : [],
        timeline: svc.projected_timeline || null,
      });
    }
  }

  return { scopeItems, warnings };
}

/**
 * Extract JSON from AI response text. Handles:
 * - Raw JSON
 * - JSON wrapped in ```json code fences
 * - JSON with preamble/postamble text around code fences
 * - Nested or multiple code fences (takes the first valid one)
 */
export function extractAndParseJSON<T>(text: string, label: string): T {
  const trimmed = text.trim();

  // Try 1: direct parse (cleanest case)
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue to fence extraction
  }

  // Try 2: extract from code fence (handles preamble text before/after fence)
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue to brace extraction
    }
  }

  // Try 3: find the first { ... } or [ ... ] block (last resort)
  const braceStart = trimmed.indexOf('{');
  const bracketStart = trimmed.indexOf('[');
  const start = braceStart >= 0 && (bracketStart < 0 || braceStart < bracketStart) ? braceStart : bracketStart;
  if (start >= 0) {
    const closer = trimmed[start] === '{' ? '}' : ']';
    const end = trimmed.lastIndexOf(closer);
    if (end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        // fall through to error
      }
    }
  }

  throw new Error(`[proposal-generation] Failed to extract JSON for ${label}. Raw response (first 300 chars): ${trimmed.slice(0, 300)}`);
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  return new Anthropic({ apiKey });
}

/**
 * Generate 4 proposal sections using Claude API.
 * Section 5 (Fee Summary) is data-driven, not AI-generated.
 */
export async function generateProposalSections(
  input: ProposalGenerationInput
): Promise<GeneratedSections> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(input),
      },
    ],
  });

  // Extract the text response
  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  // Parse JSON from response (handle markdown code fences + preamble text)
  const parsed = extractAndParseJSON<Record<string, {
    title: string;
    content: string;
    scope_items?: ScopeItem[];
    timeline_phases?: TimelinePhase[];
  }>>(textBlock.text, 'proposal sections');

  // Validate all 4 sections exist
  const requiredKeys = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'];
  for (const key of requiredKeys) {
    if (!parsed[key]?.title || !parsed[key]?.content) {
      throw new Error(`Missing or incomplete section: ${key}`);
    }
  }

  const { scopeItems, warnings } = validateScopeItems(
    parsed.scope_of_project.scope_items || [],
    input.services,
  );

  // Log any AI drift for observability
  if (warnings.length > 0) {
    console.warn('[proposal-generation] scope_items validation warnings:', {
      company: input.companyName,
      selectedCount: input.services.length,
      aiReturnedCount: (parsed.scope_of_project.scope_items || []).length,
      validatedCount: scopeItems.length,
      warnings,
    });
  }

  // Validate timeline_phases have required fields
  const timelinePhases: TimelinePhase[] = (parsed.project_timeline.timeline_phases || []).map(phase => ({
    phase_label: phase.phase_label || 'Phase',
    deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
  }));

  return {
    overview_and_goals: {
      type: 'overview_and_goals',
      title: parsed.overview_and_goals.title,
      content: parsed.overview_and_goals.content,
      sort_order: 1,
    },
    scope_of_project: {
      type: 'scope_of_project',
      title: parsed.scope_of_project.title,
      content: parsed.scope_of_project.content,
      sort_order: 2,
      scope_items: scopeItems,
    },
    project_timeline: {
      type: 'project_timeline',
      title: parsed.project_timeline.title,
      content: parsed.project_timeline.content,
      sort_order: 3,
      timeline_phases: timelinePhases,
    },
    why_brik: {
      type: 'why_brik',
      title: parsed.why_brik.title,
      content: parsed.why_brik.content,
      sort_order: 4,
    },
  };
}

/**
 * Regenerate a single proposal section.
 * Useful when admin wants to re-draft just one section.
 */
export async function regenerateSection(
  input: ProposalGenerationInput,
  sectionType: 'overview_and_goals' | 'scope_of_project' | 'project_timeline' | 'why_brik',
  currentContent?: string
): Promise<GeneratedSection> {
  const client = getAnthropicClient();

  const sectionNames: Record<string, string> = {
    overview_and_goals: 'Overview and Goals',
    scope_of_project: 'Scope of Project',
    project_timeline: 'Project Timeline',
    why_brik: 'Why Brik?',
  };

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Regenerate ONLY the "${sectionNames[sectionType]}" section for this proposal. Return JSON: { "title": "...", "content": "markdown..." }

${currentContent ? `The current draft is:\n${currentContent}\n\nPlease write a fresh version that's different but still addresses the same points.\n\n` : ''}${buildUserPrompt(input)}`,
      },
    ],
  });

  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  const parsed = extractAndParseJSON<{ title?: string; content: string }>(textBlock.text, `regenerate ${sectionType}`);

  const sortOrders: Record<string, number> = {
    overview_and_goals: 1,
    scope_of_project: 2,
    project_timeline: 3,
    why_brik: 4,
  };

  return {
    type: sectionType,
    title: parsed.title || sectionNames[sectionType],
    content: parsed.content,
    sort_order: sortOrders[sectionType],
  };
}
