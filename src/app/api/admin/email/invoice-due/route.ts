import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendInvoiceDueEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { invoice_id } = await request.json();
  if (!invoice_id) {
    return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch invoice with company
  const { data: invoice, error: invoiceError } = await serviceClient
    .from('invoices')
    .select('id, description, amount_cents, due_date, invoice_url, company_id, companies(id, name)')
    .eq('id', invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const company = invoice.companies as unknown as { id: string; name: string };

  // Find primary contact with email
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
    const result = await sendInvoiceDueEmail({
      to: contact.email,
      recipientName: contact.first_name,
      companyName: company.name,
      invoiceDescription: invoice.description || 'Invoice',
      amountCents: invoice.amount_cents,
      dueDate: invoice.due_date || new Date().toISOString(),
      invoiceUrl: invoice.invoice_url || undefined,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: `Invoice due: ${invoice.description || 'Invoice'} — $${(invoice.amount_cents / 100).toFixed(2)}`,
      template: 'invoice_due',
      resendId: result?.id,
      companyId: invoice.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send invoice due email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
