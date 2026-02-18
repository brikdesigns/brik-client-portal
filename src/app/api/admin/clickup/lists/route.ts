import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLists } from '@/lib/clickup';

export async function GET(request: Request) {
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
