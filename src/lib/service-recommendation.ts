/**
 * AI-powered service recommendation.
 * Analyzes discovery call meeting notes against the service catalog
 * and recommends which services to include in a proposal.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

export interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  proposal_copy: string | null;
  included_scope: string | null;
  base_price_cents: number | null;
  billing_frequency: string | null;
  service_type: string | null;
  category_name: string | null;
  category_slug: string | null;
}

export interface ServiceRecommendation {
  service_id: string;
  reason: string;
}

const SYSTEM_PROMPT = `You are a service consultant for Brik Designs, a design and marketing agency. Your job is to analyze discovery call meeting notes and recommend which services from the catalog would address the client's needs.

## How to Recommend
- Match services to specific pain points, goals, or requests mentioned in the meeting notes
- If the client mentions needing a website, recommend website-related services
- If the client mentions branding issues, recommend brand services
- If the client mentions marketing/SEO/social media, recommend marketing services
- If the client has operational pain points, recommend service design/back office services
- Recommend foundational services first (branding, website) before add-ons (SEO, social media management)
- Be selective — only recommend services that are clearly relevant. Don't pad the proposal.
- Typical proposals have 3-8 services. Rarely more than 10.

## Output
Return ONLY a JSON array. Each element has "service_id" (string) and "reason" (one sentence explaining why this service fits).`;

function buildUserPrompt(meetingNotes: string, services: CatalogService[]): string {
  const catalogBlock = services.map(s => {
    const price = s.base_price_cents
      ? `$${(s.base_price_cents / 100).toLocaleString()}`
      : 'Custom pricing';
    const freq = s.billing_frequency === 'recurring' ? '/mo' : s.billing_frequency === 'one_time' ? ' one-time' : '';
    return `- **${s.name}** (ID: ${s.id}) [${s.category_name || 'General'}] — ${price}${freq}
  ${s.proposal_copy || s.description || 'No description'}`;
  }).join('\n');

  return `Analyze the following discovery call meeting notes and recommend services from the catalog below.

## Meeting Notes
${meetingNotes}

## Service Catalog
${catalogBlock}

Return a JSON array of recommended services. Example:
[
  {"service_id": "abc-123", "reason": "Client needs a new website to replace their outdated one."},
  {"service_id": "def-456", "reason": "Client mentioned wanting to improve their Google rankings."}
]`;
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  return new Anthropic({ apiKey });
}

/**
 * Analyze meeting notes and recommend services from the catalog.
 */
export async function recommendServices(
  meetingNotes: string,
  services: CatalogService[]
): Promise<ServiceRecommendation[]> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(meetingNotes, services) },
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

  const parsed: ServiceRecommendation[] = JSON.parse(jsonStr);

  // Validate service IDs exist in catalog
  const validIds = new Set(services.map(s => s.id));
  return parsed.filter(r => validIds.has(r.service_id));
}
