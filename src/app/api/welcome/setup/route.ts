import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/welcome/setup
 *
 * Public endpoint — no auth required (token-based).
 * Creates a Supabase auth user from a contact's setup token,
 * links the contact to the user, and marks setup as complete.
 */
export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up contact by setup token
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, full_name, email, company_id, role, setup_token_expires_at, setup_completed_at')
    .eq('setup_token', token)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Invalid setup link' }, { status: 404 });
  }

  if (contact.setup_completed_at) {
    return NextResponse.json({ error: 'Account has already been set up' }, { status: 400 });
  }

  // Check expiration
  if (contact.setup_token_expires_at) {
    const expiresAt = new Date(contact.setup_token_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Setup link has expired' }, { status: 410 });
    }
  }

  if (!contact.email) {
    return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: contact.email,
    password,
    email_confirm: true, // Auto-confirm since they got the link via verified email
    user_metadata: {
      full_name: contact.full_name,
      role: contact.role || 'client',
    },
  });

  if (authError) {
    // User might already exist (e.g. re-invited)
    if (authError.message?.includes('already been registered')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try signing in instead.' },
        { status: 409 }
      );
    }
    console.error('Failed to create auth user:', authError);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  const userId = authData.user.id;

  // Update the profile (auto-created by Supabase trigger) with role + company
  await supabase
    .from('profiles')
    .update({
      full_name: contact.full_name,
      role: contact.role || 'client',
      company_id: contact.company_id,
    })
    .eq('id', userId);

  // Link the contact to the auth user and mark setup complete
  await supabase
    .from('contacts')
    .update({
      user_id: userId,
      setup_completed_at: new Date().toISOString(),
      setup_token: null, // Invalidate the token
      setup_token_expires_at: null,
    })
    .eq('id', contact.id);

  // Add to company_users junction table
  if (contact.company_id) {
    await supabase
      .from('company_users')
      .upsert({
        company_id: contact.company_id,
        user_id: userId,
        role: contact.role || 'client',
      }, { onConflict: 'company_id,user_id' });
  }

  return NextResponse.json({ success: true, user_id: userId });
}
