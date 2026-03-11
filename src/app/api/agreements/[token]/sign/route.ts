import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { tryPromoteCompany } from '@/lib/agreements/promote';
import { sendAgreementSignedEmail, logEmail } from '@/lib/email';
import { getPrimaryAdminEmail } from '@/lib/admin-notifications';
import { parseBody, isValidationError, emailSchema, nonEmptyString } from '@/lib/validation';
import { rateLimitOrNull, getClientIp, PUBLIC_TOKEN_LIMIT } from '@/lib/rate-limit';

const signSchema = z.object({
  name: nonEmptyString.describe('Full legal name'),
  email: emailSchema,
});

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit
  const limited = rateLimitOrNull(request, 'agreement-sign', PUBLIC_TOKEN_LIMIT);
  if (limited) return limited;

  const { token } = await params;
  const supabase = getServiceClient();

  // Validate input
  const body = await parseBody(request, signSchema);
  if (isValidationError(body)) return body;
  const { name, email } = body;

  // Fetch agreement
  const { data: agreement, error } = await supabase
    .from('agreements')
    .select('id, company_id, status, valid_until')
    .eq('token', token)
    .single();

  if (error || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  // Validate state
  if (agreement.status === 'signed') {
    return NextResponse.json({ error: 'Agreement has already been signed' }, { status: 400 });
  }

  if (agreement.status === 'expired') {
    return NextResponse.json({ error: 'Agreement has expired' }, { status: 400 });
  }

  if (agreement.status === 'draft') {
    return NextResponse.json({ error: 'Agreement has not been sent yet' }, { status: 400 });
  }

  if (agreement.valid_until) {
    const expiry = new Date(agreement.valid_until);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      await supabase
        .from('agreements')
        .update({ status: 'expired' })
        .eq('id', agreement.id);
      return NextResponse.json({ error: 'Agreement has expired' }, { status: 400 });
    }
  }

  // Capture ESIGN audit trail
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error: updateError } = await supabase
    .from('agreements')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by_name: name,
      signed_by_email: email,
      signed_by_ip: ip,
      signed_by_user_agent: userAgent,
    })
    .eq('id', agreement.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notify admin(s) that agreement was signed (non-blocking)
  try {
    const adminEmail = await getPrimaryAdminEmail();
    const { data: fullAgreement } = await supabase
      .from('agreements')
      .select('title, company_id, companies(name, slug)')
      .eq('id', agreement.id)
      .single();

    if (fullAgreement && adminEmail) {
      const company = fullAgreement.companies as unknown as { name: string; slug: string };
      const signedAt = new Date().toISOString();
      const result = await sendAgreementSignedEmail({
        to: adminEmail,
        companyName: company.name,
        agreementTitle: fullAgreement.title || 'Agreement',
        signedByName: name,
        signedByEmail: email,
        signedAt,
        companySlug: company.slug,
      });

      await logEmail(supabase, {
        to: adminEmail,
        subject: `Agreement signed: ${company.name} — ${fullAgreement.title || 'Agreement'}`,
        template: 'agreement_signed',
        resendId: result?.id,
        companyId: fullAgreement.company_id,
      });
    }
  } catch (err) {
    console.error('Failed to send agreement signed notification:', err);
  }

  // Check if all agreements are now signed — promote company to client if so
  try {
    await tryPromoteCompany(agreement.company_id);
  } catch (err) {
    console.error('Failed to promote company after agreement signing:', err);
  }

  return NextResponse.json({ success: true });
}
