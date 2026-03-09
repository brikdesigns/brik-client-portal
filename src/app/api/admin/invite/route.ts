import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { sendInviteEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { user, profile } = auth;

  // Parse request body
  const body = await request.json();
  const { email, full_name, role, company_id } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (role && !['super_admin', 'client'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Use service role client to create the user via invite
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: full_name || '',
      role: role || 'client',
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update the profile with invited_by info and client assignment
  if (data.user) {
    await serviceClient
      .from('profiles')
      .update({
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        company_id: company_id || null,
      })
      .eq('id', data.user.id);
  }

  // Send branded welcome email via Resend (non-blocking)
  try {
    const emailResult = await sendInviteEmail({
      to: email,
      inviteeName: full_name,
      inviterName: profile?.full_name || undefined,
    });

    // Log the email
    await logEmail(serviceClient, {
      to: email,
      subject: 'You\'ve been invited to the Brik Designs client portal',
      template: 'invite',
      resendId: emailResult?.id,
    });
  } catch (emailError) {
    // Don't fail the invite if email sending fails — the Supabase invite email is the critical one
    console.error('Branded email send failed (non-critical):', emailError);
  }

  return NextResponse.json({ success: true, user_id: data.user?.id });
}
