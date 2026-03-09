import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendWelcomeToBrikEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { contact_id } = await request.json();
  if (!contact_id) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contact, error: contactError } = await serviceClient
    .from('contacts')
    .select('id, full_name, email, company_id, companies(id, name)')
    .eq('id', contact_id)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  if (!contact.email) {
    return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });
  }

  const company = contact.companies as unknown as { id: string; name: string };
  const firstName = contact.full_name?.split(' ')[0] || undefined;

  try {
    const result = await sendWelcomeToBrikEmail({
      to: contact.email,
      recipientName: firstName,
      companyName: company.name,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: 'Welcome to Brik!',
      template: 'welcome_to_brik',
      resendId: result?.id,
      companyId: contact.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
