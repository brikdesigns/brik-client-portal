import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { searchMeetingByClientName } from '@/lib/notion-fetch';

/**
 * GET /api/admin/proposals/meeting-notes?company_name=...
 * Search Notion for meeting note pages. Returns all results so the user can browse and pick.
 * Searches by company name first, then falls back to "discovery" keyword for broader results.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company_name');

  if (!companyName) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  try {
    // Query the Meetings database filtered by company name
    // Falls back to recent meetings if no title match
    const results = await searchMeetingByClientName(companyName, { exactMatch: false });
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Meeting notes search failed:', err);
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
