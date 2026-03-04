import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendPaymentReceivedEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { invoice_id } = await request.json();
  if (!invoice_id) {
    return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
  }

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
    .select('full_name, email')
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
      recipientName: contact.full_name,
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
