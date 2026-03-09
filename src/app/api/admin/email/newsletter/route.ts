import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendNewsletterEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { company_ids, subject, body_html, cta_label, cta_url } = await request.json();
  if (!subject || !body_html) {
    return NextResponse.json({ error: 'subject and body_html are required' }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve recipients: primary contacts for specified companies (or all active clients)
  let query = serviceClient
    .from('contacts')
    .select('full_name, email, company_id, companies(id, name)')
    .eq('is_primary', true)
    .not('email', 'is', null);

  if (company_ids && Array.isArray(company_ids) && company_ids.length > 0) {
    query = query.in('company_id', company_ids);
  }

  const { data: contacts, error: contactsError } = await query;

  if (contactsError || !contacts?.length) {
    return NextResponse.json({ error: 'No contacts found' }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    try {
      const result = await sendNewsletterEmail({
        to: contact.email!,
        recipientName: contact.full_name,
        subject,
        bodyHtml: body_html,
        ctaLabel: cta_label,
        ctaUrl: cta_url,
      });

      await logEmail(serviceClient, {
        to: contact.email!,
        subject,
        template: 'newsletter',
        resendId: result?.id,
        companyId: contact.company_id,
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send newsletter to ${contact.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed, total: contacts.length });
}
