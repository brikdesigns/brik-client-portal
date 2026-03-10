import { NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendProposalEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { proposal_id } = await request.json();
  if (!proposal_id) {
    return NextResponse.json({ error: 'proposal_id is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: proposal, error: proposalError } = await serviceClient
    .from('proposals')
    .select('id, token, company_id, companies(id, name)')
    .eq('id', proposal_id)
    .single();

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const company = proposal.companies as unknown as { id: string; name: string };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com';
  const proposalUrl = `${siteUrl}/proposals/${proposal.token}`;

  const { data: contact } = await serviceClient
    .from('contacts')
    .select('full_name, email')
    .eq('company_id', proposal.company_id)
    .eq('is_primary', true)
    .not('email', 'is', null)
    .single();

  if (!contact?.email) {
    return NextResponse.json({ error: 'No primary contact with email found for this company' }, { status: 400 });
  }

  try {
    const result = await sendProposalEmail({
      to: contact.email,
      recipientName: contact.full_name,
      companyName: company.name,
      proposalUrl,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: 'Brik Designs sent you a proposal',
      template: 'proposal_sent',
      resendId: result?.id,
      companyId: proposal.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send proposal email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
