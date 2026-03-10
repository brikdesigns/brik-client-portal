import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { getLists } from '@/lib/clickup';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folder_id');

  if (!folderId) {
    return NextResponse.json({ error: 'folder_id is required' }, { status: 400 });
  }

  try {
    const lists = await getLists(folderId);
    return NextResponse.json({ lists });
  } catch (err) {
    console.error('ClickUp lists error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch ClickUp lists' },
      { status: 502 }
    );
  }
}
