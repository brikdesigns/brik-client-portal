import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { searchMeetingByClientName, fetchMeetingNotes } from '@/lib/notion-fetch';

/**
 * GET /api/admin/proposals/meeting-notes?company_name=...
 * Search Notion for meeting note pages. Returns all results so the user can browse and pick.
 *
 * GET /api/admin/proposals/meeting-notes?page_id=...
 * Fetch the full content of a specific meeting note page.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('page_id');
  const companyName = searchParams.get('company_name');

  // Mode 1: Fetch content of a specific note
  if (pageId) {
    try {
      const content = await fetchMeetingNotes(pageId);
      return NextResponse.json({ content });
    } catch (err) {
      console.error('Meeting note fetch failed:', err);
      const message = err instanceof Error ? err.message : 'Fetch failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Mode 2: Search by company name
  if (!companyName) {
    return NextResponse.json({ error: 'company_name or page_id is required' }, { status: 400 });
  }

  try {
    const results = await searchMeetingByClientName(companyName, { exactMatch: false });
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Meeting notes search failed:', err);
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
