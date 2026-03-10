import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { generateAgreementsForProposal } from '@/lib/agreements/generate';
import { sendProposalAcceptedEmail, sendWelcomeToBrikEmail, logEmail } from '@/lib/email';

const ADMIN_EMAIL = 'nick@brikdesigns.com';

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
  const { token } = await params;
  const supabase = getServiceClient();

  const body = await request.json();
  const { email } = body as { email?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Fetch proposal
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, company_id, status, valid_until')
    .eq('token', token)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Validate state
  if (proposal.status === 'accepted') {
    return NextResponse.json({ error: 'Proposal has already been accepted' }, { status: 400 });
  }

  if (proposal.status === 'expired' || proposal.status === 'declined') {
    return NextResponse.json({ error: `Proposal is ${proposal.status}` }, { status: 400 });
  }

  if (proposal.valid_until) {
    const expiry = new Date(proposal.valid_until);
    expiry.setHours(23, 59, 59, 999);
    if (new Date() > expiry) {
      await supabase
        .from('proposals')
        .update({ status: 'expired' })
        .eq('id', proposal.id);
      return NextResponse.json({ error: 'Proposal has expired' }, { status: 400 });
    }
  }

  // Capture audit trail
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by_email: email,
      accepted_by_ip: ip,
      accepted_by_user_agent: userAgent,
    })
    .eq('id', proposal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Auto-generate agreement(s) after proposal acceptance
  try {
    await generateAgreementsForProposal(proposal.id, proposal.company_id);
  } catch (err) {
    // Log but don't fail — proposal acceptance is the critical path
    console.error('Failed to auto-generate agreements:', err);
  }

  // Fetch company details for email notifications
  const { data: company } = await supabase
    .from('companies')
    .select('name, slug')
    .eq('id', proposal.company_id)
    .single();

  // Look up the contact name for the accepting email
  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name')
    .eq('company_id', proposal.company_id)
    .eq('email', email)
    .single();

  // Notify admin that proposal was accepted (non-blocking)
  try {
    if (company) {
      const result = await sendProposalAcceptedEmail({
        to: ADMIN_EMAIL,
        companyName: company.name,
        companySlug: company.slug,
        proposalId: proposal.id,
      });

      await logEmail(supabase, {
        to: ADMIN_EMAIL,
        subject: `Proposal signed: ${company.name}`,
        template: 'proposal_accepted',
        resendId: result?.id,
        companyId: proposal.company_id,
      });
    }
  } catch (err) {
    console.error('Failed to send proposal accepted notification:', err);
  }

  // Send "Welcome to Brik" email to the prospect (non-blocking)
  try {
    if (company) {
      const result = await sendWelcomeToBrikEmail({
        to: email,
        recipientName: contact?.first_name ?? undefined,
        companyName: company.name,
      });

      await logEmail(supabase, {
        to: email,
        subject: 'Welcome to Brik!',
        template: 'welcome_to_brik',
        resendId: result?.id,
        companyId: proposal.company_id,
      });
    }
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  return NextResponse.json({ success: true });
}
