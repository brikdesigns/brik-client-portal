import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { getFolders } from '@/lib/clickup';

export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const folders = await getFolders();
    return NextResponse.json({ folders });
  } catch (err) {
    console.error('ClickUp folders error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch ClickUp folders' },
      { status: 502 }
    );
  }
}
