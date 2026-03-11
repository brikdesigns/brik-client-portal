import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseBody, isValidationError, emailSchema, passwordSchema } from '@/lib/validation';
import { rateLimitOrNull, getClientIp, SETUP_LIMIT } from '@/lib/rate-limit';

/**
 * Map contact organizational role → company_users permission role.
 *
 * contact.role describes who they are at their company.
 * company_users.role determines what they can do in the portal.
 */
const CONTACT_TO_COMPANY_ROLE: Record<string, string> = {
  owner: 'owner',
  admin: 'admin',
  manager: 'member',
  team_member: 'viewer',
};

const setupSchema = z.object({
  token: z.string().min(1, 'Setup token is required'),
  password: passwordSchema,
  email: emailSchema.optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

/**
 * POST /api/welcome/setup
 *
 * Public endpoint — no auth required (token-based).
 * Creates a Supabase auth user from a contact's setup token,
 * links the contact to the user, and marks setup as complete.
 */
export async function POST(request: Request) {
  // Rate limit — stricter for account creation
  const limited = rateLimitOrNull(request, 'welcome-setup', SETUP_LIMIT);
  if (limited) return limited;

  const ip = getClientIp(request);

  try {
    // Validate input
    const body = await parseBody(request, setupSchema);
    if (isValidationError(body)) return body;
    const { token, password, email, first_name, last_name } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up contact by setup token
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company_id, role, setup_token_expires_at, setup_completed_at')
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

    // Use submitted values, falling back to contact record
    const finalEmail = email?.trim() || contact.email;
    const finalFirstName = first_name?.trim() || contact.first_name;
    const finalLastName = last_name?.trim() ?? contact.last_name;

    if (!finalEmail) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Create Supabase auth user
    // profiles.role is always 'client' for portal users — contact.role is an organizational title,
    // not a portal permission. The handle_new_user trigger reads role from user_metadata.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password,
      email_confirm: true, // Auto-confirm since they got the link via verified email
      user_metadata: {
        full_name: [finalFirstName, finalLastName].filter(Boolean).join(' '),
        role: 'client',
      },
    });

    if (authError) {
      // User might already exist (e.g. re-invited)
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Try signing in instead.' },
          { status: 409 }
        );
      }
      console.error('Failed to create auth user:', authError);
      return NextResponse.json({ error: authError.message || 'Failed to create account' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Update the profile (auto-created by Supabase trigger) with role + company
    await supabase
      .from('profiles')
      .update({
        first_name: finalFirstName,
        last_name: finalLastName,
        role: 'client',
        company_id: contact.company_id,
      })
      .eq('id', userId);

    // Link the contact to the auth user, update name/email if changed, mark setup complete
    await supabase
      .from('contacts')
      .update({
        user_id: userId,
        first_name: finalFirstName,
        last_name: finalLastName,
        email: finalEmail,
        setup_completed_at: new Date().toISOString(),
        setup_token: null, // Invalidate the token
        setup_token_expires_at: null,
      })
      .eq('id', contact.id);

    // Record invite_accepted activity
    const userAgent = request.headers.get('user-agent') || null;
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'invite_accepted',
        ip_address: ip,
        user_agent: userAgent,
      });

    // Add to company_users junction table with mapped permission role
    if (contact.company_id) {
      const companyRole = CONTACT_TO_COMPANY_ROLE[contact.role] ?? 'viewer';
      await supabase
        .from('company_users')
        .upsert({
          company_id: contact.company_id,
          user_id: userId,
          role: companyRole,
        }, { onConflict: 'company_id,user_id' });
    }

    return NextResponse.json({ success: true, user_id: userId });
  } catch (err) {
    console.error('Welcome setup unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
