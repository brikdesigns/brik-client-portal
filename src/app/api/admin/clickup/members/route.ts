import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { getMembers } from '@/lib/clickup';

export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const members = await getMembers();
    return NextResponse.json({ members });
  } catch (err) {
    console.error('ClickUp members error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch ClickUp members' },
      { status: 502 }
    );
  }
}
