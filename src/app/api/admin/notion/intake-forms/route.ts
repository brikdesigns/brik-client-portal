import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

/** Web Intake Form database (data source ID) */
const INTAKE_DATA_SOURCE_ID = '2e597d34-ed28-80c8-807a-d443fd355471';

function getNotionToken(): string {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN environment variable is not set');
  return token;
}

interface IntakeFormOption {
  id: string;
  title: string;
  industry: string | null;
  subIndustry: string | null;
  projectType: string[];
  lastEdited: string;
}

/**
 * GET /api/admin/notion/intake-forms
 * Fetches all entries from the "New Web Projet" Notion database
 * for the intake form selector modal.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const res = await fetch(`${NOTION_API}/databases/${INTAKE_DATA_SOURCE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getNotionToken()}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 50,
        sorts: [{ property: 'Submission time', direction: 'descending' }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Notion query failed:', errData);
      return NextResponse.json(
        { error: 'Failed to fetch intake forms from Notion' },
        { status: 502 },
      );
    }

    const data = await res.json();

    const results: IntakeFormOption[] = (data.results ?? []).map(
      (page: Record<string, unknown>) => {
        const props = page.properties as Record<string, Record<string, unknown>>;

        // Extract title
        const titleProp = props['Client Name'] as { title?: { plain_text: string }[] } | undefined;
        const title = titleProp?.title?.[0]?.plain_text ?? 'Untitled';

        // Extract industry (multi_select)
        const industryProp = props['Industry'] as { multi_select?: { name: string }[] } | undefined;
        const industry = industryProp?.multi_select?.[0]?.name ?? null;

        // Extract sub-industry (select)
        const subIndustryProp = props['Sub-industry'] as { select?: { name: string } | null } | undefined;
        const subIndustry = subIndustryProp?.select?.name ?? null;

        // Extract project type (multi_select)
        const projectTypeProp = props['Project Type'] as { multi_select?: { name: string }[] } | undefined;
        const projectType = projectTypeProp?.multi_select?.map((s: { name: string }) => s.name) ?? [];

        return {
          id: page.id as string,
          title,
          industry,
          subIndustry,
          projectType,
          lastEdited: page.last_edited_time as string,
        };
      },
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Intake forms fetch failed:', err);
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
