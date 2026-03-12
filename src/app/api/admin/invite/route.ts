import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { sendInviteEmail, logEmail } from '@/lib/email';
import { parseBody, isValidationError, emailSchema } from '@/lib/validation';

const inviteSchema = z.object({
  email: emailSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(['super_admin', 'client']).optional(),
  company_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { user, profile } = auth;

  const body = await parseBody(request, inviteSchema);
  if (isValidationError(body)) return body;
  const { email, first_name, last_name, role, company_id } = body;

  // Use service role client to create the user via invite
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: [first_name, last_name].filter(Boolean).join(' ') || '',
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
      inviteeName: [first_name, last_name].filter(Boolean).join(' ') || undefined,
      inviterName: profile?.first_name || undefined,
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
