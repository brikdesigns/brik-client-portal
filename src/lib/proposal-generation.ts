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

export interface GeneratedSection {
  type: string;
  title: string;
  content: string;
  sort_order: number;
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
Return a JSON object with exactly 4 keys. Each value is an object with "title" (string) and "content" (markdown string).

{
  "overview_and_goals": {
    "title": "Overview and Goals",
    "content": "Markdown content here..."
  },
  "scope_of_project": {
    "title": "Scope of Project",
    "content": "Markdown content here..."
  },
  "project_timeline": {
    "title": "Project Timeline",
    "content": "Markdown content here..."
  },
  "why_brik": {
    "title": "Why Brik?",
    "content": "Markdown content here..."
  }
}

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

  // Parse JSON from response (handle markdown code fences)
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: Record<string, { title: string; content: string }>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${jsonStr.slice(0, 200)}...`);
  }

  // Validate all 4 sections exist
  const requiredKeys = ['overview_and_goals', 'scope_of_project', 'project_timeline', 'why_brik'];
  for (const key of requiredKeys) {
    if (!parsed[key]?.title || !parsed[key]?.content) {
      throw new Error(`Missing or incomplete section: ${key}`);
    }
  }

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
    },
    project_timeline: {
      type: 'project_timeline',
      title: parsed.project_timeline.title,
      content: parsed.project_timeline.content,
      sort_order: 3,
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

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(jsonStr);

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
