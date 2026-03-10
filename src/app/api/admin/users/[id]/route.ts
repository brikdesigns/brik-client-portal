import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const supabase = await createClient();

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name,
        email: body.email,
        role: body.role,
        is_active: body.is_active,
        company_id: body.company_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
