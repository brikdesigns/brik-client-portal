import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendPaymentReceivedEmail, logEmail } from '@/lib/email';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';

const paymentReceivedSchema = z.object({ invoice_id: uuidSchema });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await parseBody(request, paymentReceivedSchema);
  if (isValidationError(body)) return body;
  const { invoice_id } = body;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invoice, error: invoiceError } = await serviceClient
    .from('invoices')
    .select('id, description, amount_cents, company_id, companies(id, name)')
    .eq('id', invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const company = invoice.companies as unknown as { id: string; name: string };

  const { data: contact } = await serviceClient
    .from('contacts')
    .select('first_name, email')
    .eq('company_id', invoice.company_id)
    .eq('is_primary', true)
    .not('email', 'is', null)
    .single();

  if (!contact?.email) {
    return NextResponse.json({ error: 'No primary contact with email found for this company' }, { status: 400 });
  }

  try {
    const result = await sendPaymentReceivedEmail({
      to: contact.email,
      recipientName: contact.first_name,
      companyName: company.name,
      invoiceDescription: invoice.description || 'Invoice',
      amountCents: invoice.amount_cents,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: `Payment received — thank you, ${company.name}`,
      template: 'payment_received',
      resendId: result?.id,
      companyId: invoice.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send payment received email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
