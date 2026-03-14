import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/contacts/[id]
 *
 * Deletes a contact record. If the contact has portal access (user_id),
 * the auth user is NOT deleted — only the contact row is removed.
 * User deletion is a separate, more destructive operation.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify contact exists
  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select('id, full_name, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Delete the contact row
  const { error: deleteError } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete contact', details: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, had_portal_access: !!contact.user_id });
}
