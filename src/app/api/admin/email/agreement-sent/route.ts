import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendAgreementEmail, logEmail } from '@/lib/email';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';

const agreementSentSchema = z.object({ agreement_id: uuidSchema });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await parseBody(request, agreementSentSchema);
  if (isValidationError(body)) return body;
  const { agreement_id } = body;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: agreement, error: agreementError } = await serviceClient
    .from('agreements')
    .select('id, token, title, company_id, companies(id, name)')
    .eq('id', agreement_id)
    .single();

  if (agreementError || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  const company = agreement.companies as unknown as { id: string; name: string };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com';
  const agreementUrl = `${siteUrl}/agreements/${agreement.token}`;

  const { data: contact } = await serviceClient
    .from('contacts')
    .select('first_name, email')
    .eq('company_id', agreement.company_id)
    .eq('is_primary', true)
    .not('email', 'is', null)
    .single();

  if (!contact?.email) {
    return NextResponse.json({ error: 'No primary contact with email found for this company' }, { status: 400 });
  }

  try {
    const result = await sendAgreementEmail({
      to: contact.email,
      recipientName: contact.first_name,
      companyName: company.name,
      agreementTitle: agreement.title || 'Agreement',
      agreementUrl,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: `${company.name} — Your agreement from Brik Designs is ready to sign`,
      template: 'agreement_sent',
      resendId: result?.id,
      companyId: agreement.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send agreement email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
