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
    // Search broadly (no exact match filter) so user sees all relevant pages
    const results = await searchMeetingByClientName(companyName, { exactMatch: false });

    // If no results from company name, try broader "discovery" search
    if (results.length === 0) {
      const fallback = await searchMeetingByClientName('discovery', { exactMatch: false });
      return NextResponse.json({ results: fallback });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Meeting notes search failed:', err);
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
