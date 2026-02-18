import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMembers } from '@/lib/clickup';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
