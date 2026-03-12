import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { parseBody, isValidationError, emailSchema } from '@/lib/validation';

const updateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: emailSchema.optional(),
  role: z.enum(['super_admin', 'client']).optional(),
  is_active: z.boolean().optional(),
  company_id: z.string().uuid().optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const auth = await requireAdmin();
    if (isAuthError(auth)) return auth;

    const body = await parseBody(request, updateUserSchema);
    if (isValidationError(body)) return body;

    const supabase = await createClient();

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
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
