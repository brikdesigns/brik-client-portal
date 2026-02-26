/**
 * Notion meeting notes fetcher.
 * Searches for discovery call transcripts by client name, or fetches by page URL.
 * Uses Notion REST API directly with NOTION_TOKEN env var.
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function getNotionToken(): string {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN environment variable is not set');
  return token;
}

function notionHeaders() {
  return {
    'Authorization': `Bearer ${getNotionToken()}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

/**
 * Extract a Notion page ID (UUID) from a Notion URL.
 * Handles formats like:
 *   https://notion.so/Page-Name-30f97d34ed2880d6b7e5c876970858cd
 *   https://www.notion.so/workspace/Page-30f97d34ed2880d6b7e5c876970858cd?source=copy_link
 */
export function extractPageId(url: string): string {
  // Strip query params
  const cleaned = url.split('?')[0];
  // Get the last path segment
  const segments = cleaned.split('/');
  const lastSegment = segments[segments.length - 1];
  // Extract the 32-char hex ID from the end
  const match = lastSegment.match(/([a-f0-9]{32})$/i);
  if (!match) {
    throw new Error(`Could not extract page ID from URL: ${url}`);
  }
  const hex = match[1];
  // Format as UUID: 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface NotionSearchResult {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
}

/**
 * Search Notion for meeting pages by client name in the title.
 * Meeting notes are titled with [client-name] (e.g. "EXAMPLE DISCOVERY - Birdwell & Mutlak Dentistry").
 */
export async function searchMeetingByClientName(clientName: string): Promise<NotionSearchResult[]> {
  const res = await fetch(`${NOTION_API}/search`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      query: clientName,
      filter: { value: 'page', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 10,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion search failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  return (data.results || [])
    .filter((page: Record<string, unknown>) => {
      // Only include pages whose title contains the client name (case-insensitive)
      const title = extractTitle(page);
      return title.toLowerCase().includes(clientName.toLowerCase());
    })
    .map((page: Record<string, unknown>) => ({
      id: page.id as string,
      title: extractTitle(page),
      url: (page as Record<string, string>).url || '',
      lastEdited: (page as Record<string, string>).last_edited_time || '',
    }));
}

/**
 * Extract the title string from a Notion page object.
 */
function extractTitle(page: Record<string, unknown>): string {
  const props = page.properties as Record<string, unknown> | undefined;
  if (!props) return '';

  // Find the title property (could be named "title", "Name", etc.)
  for (const key of Object.keys(props)) {
    const prop = props[key] as Record<string, unknown>;
    if (prop?.type === 'title') {
      const titleArr = prop.title as Array<{ plain_text: string }>;
      if (titleArr && titleArr.length > 0) {
        return titleArr.map(t => t.plain_text).join('');
      }
    }
  }
  return '';
}

interface NotionBlock {
  type: string;
  [key: string]: unknown;
}

/**
 * Fetch all block children for a page, handling pagination.
 */
async function fetchAllBlocks(pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${NOTION_API}/blocks/${pageId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: notionHeaders(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion blocks fetch failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/**
 * Extract rich_text content from a Notion block's content object.
 */
function extractRichText(richTextArr: Array<{ plain_text: string }> | undefined): string {
  if (!richTextArr) return '';
  return richTextArr.map(rt => rt.plain_text).join('');
}

/**
 * Convert Notion blocks into a markdown string.
 */
function blocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const btype = block.type;
    const content = block[btype] as Record<string, unknown> | undefined;
    if (!content) continue;

    const text = extractRichText(content.rich_text as Array<{ plain_text: string }>);

    switch (btype) {
      case 'heading_1':
        if (text) lines.push(`# ${text}`);
        break;
      case 'heading_2':
        if (text) lines.push(`## ${text}`);
        break;
      case 'heading_3':
        if (text) lines.push(`### ${text}`);
        break;
      case 'paragraph':
        lines.push(text || '');
        break;
      case 'bulleted_list_item':
        if (text) lines.push(`- ${text}`);
        break;
      case 'numbered_list_item':
        if (text) lines.push(`1. ${text}`);
        break;
      case 'toggle':
        if (text) lines.push(`> ${text}`);
        break;
      case 'callout':
        if (text) lines.push(`> ${text}`);
        break;
      case 'quote':
        if (text) lines.push(`> ${text}`);
        break;
      case 'divider':
        lines.push('---');
        break;
      case 'code': {
        const code = extractRichText(content.rich_text as Array<{ plain_text: string }>);
        if (code) lines.push(`\`\`\`\n${code}\n\`\`\``);
        break;
      }
      case 'to_do': {
        const checked = content.checked ? '[x]' : '[ ]';
        if (text) lines.push(`- ${checked} ${text}`);
        break;
      }
      default:
        // Skip unsupported block types (table, embed, etc.)
        break;
    }
  }

  return lines.join('\n');
}

/**
 * Fetch meeting notes content from a Notion page, returned as markdown.
 */
export async function fetchMeetingNotes(pageId: string): Promise<string> {
  const blocks = await fetchAllBlocks(pageId);
  return blocksToMarkdown(blocks);
}

/**
 * Fetch meeting notes by either Notion URL or client name search.
 * Returns { content, pageId, title, url }.
 */
export async function getMeetingNotes(input: {
  notionUrl?: string;
  clientName?: string;
}): Promise<{
  content: string;
  pageId: string;
  title: string;
  url: string;
}> {
  if (input.notionUrl) {
    const pageId = extractPageId(input.notionUrl);
    const content = await fetchMeetingNotes(pageId);
    return { content, pageId, title: '', url: input.notionUrl };
  }

  if (input.clientName) {
    const results = await searchMeetingByClientName(input.clientName);
    if (results.length === 0) {
      throw new Error(`No meeting notes found for "${input.clientName}"`);
    }
    // Use the most recently edited match
    const best = results[0];
    const content = await fetchMeetingNotes(best.id);
    return { content, pageId: best.id, title: best.title, url: best.url };
  }

  throw new Error('Either notionUrl or clientName must be provided');
}
