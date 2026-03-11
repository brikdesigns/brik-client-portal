import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import { generateAgreementsForProposal } from '@/lib/agreements/generate';
import { tryPromoteCompany } from '@/lib/agreements/promote';
import { sendProposalAcceptedEmail, sendWelcomeToBrikEmail, logEmail } from '@/lib/email';
import { getPrimaryAdminEmail } from '@/lib/admin-notifications';
import { parseBody, isValidationError, emailSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp, PUBLIC_TOKEN_LIMIT } from '@/lib/rate-limit';

const acceptSchema = z.object({
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
  const ip = getClientIp(request);
  const rl = checkRateLimit(`proposal-accept:${ip}`, PUBLIC_TOKEN_LIMIT);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { token } = await params;
  const supabase = getServiceClient();

  // Validate input
  const body = await parseBody(request, acceptSchema);
  if (isValidationError(body)) return body;
  const { email } = body;

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
  if (proposal.status === 'signed') {
    return NextResponse.json({ error: 'Proposal has already been signed' }, { status: 400 });
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
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      status: 'signed',
      accepted_at: new Date().toISOString(),
      accepted_by_email: email,
      accepted_by_ip: ip,
      accepted_by_user_agent: userAgent,
    })
    .eq('id', proposal.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Auto-create company_services from proposal line items linked to catalog services.
  // Status 'pending' gives admin a review gate before activation.
  try {
    const { data: items } = await supabase
      .from('proposal_items')
      .select('service_id')
      .eq('proposal_id', proposal.id)
      .not('service_id', 'is', null);

    if (items && items.length > 0) {
      // Deduplicate service_ids (a proposal could have multiple items for the same service)
      const uniqueServiceIds = [...new Set(items.map((i) => i.service_id as string))];

      for (const serviceId of uniqueServiceIds) {
        await supabase
          .from('company_services')
          .upsert(
            {
              company_id: proposal.company_id,
              service_id: serviceId,
              status: 'pending',
              proposal_id: proposal.id,
            },
            { onConflict: 'company_id,service_id', ignoreDuplicates: true }
          );
      }
    }
  } catch (err) {
    console.error('Failed to auto-assign services:', err);
  }

  // Auto-generate + auto-sign agreement(s) with the same ESIGN audit trail.
  // The client agreed to all terms (proposal + agreements) in one action.
  try {
    await generateAgreementsForProposal(proposal.id, proposal.company_id, {
      email,
      ip,
      userAgent,
    });
  } catch (err) {
    // Log but don't fail — proposal acceptance is the critical path
    console.error('Failed to auto-generate agreements:', err);
  }

  // Promote company to client/active if proposal + all agreements are signed
  try {
    await tryPromoteCompany(proposal.company_id);
  } catch (err) {
    console.error('Failed to promote company:', err);
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

  // Notify admin(s) that proposal was accepted (non-blocking)
  try {
    const adminEmail = await getPrimaryAdminEmail();
    if (company && adminEmail) {
      const result = await sendProposalAcceptedEmail({
        to: adminEmail,
        companyName: company.name,
        companySlug: company.slug,
        proposalId: proposal.id,
      });

      await logEmail(supabase, {
        to: adminEmail,
        subject: `Proposal signed: ${company.name}`,
        template: 'proposal_accepted',
        resendId: result?.id,
        companyId: proposal.company_id,
      });
    }
  } catch (err) {
    console.error('Failed to send proposal accepted notification:', err);
  }

  // Send "Welcome to Brik" email to the prospect with setup link (non-blocking)
  try {
    if (company) {
      // Generate a setup token for the contact so the welcome email links to /welcome/[token]
      let setupUrl: string | undefined;
      const signerContact = await supabase
        .from('contacts')
        .select('id, setup_completed_at')
        .eq('company_id', proposal.company_id)
        .eq('email', email)
        .single();

      if (signerContact.data && !signerContact.data.setup_completed_at) {
        const setupToken = crypto.randomUUID();
        const SETUP_TOKEN_TTL_DAYS = 7;
        const expiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('contacts')
          .update({ setup_token: setupToken, setup_token_expires_at: expiresAt })
          .eq('id', signerContact.data.id);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        setupUrl = `${siteUrl}/welcome/${setupToken}`;
      }

      const result = await sendWelcomeToBrikEmail({
        to: email,
        recipientName: contact?.first_name ?? undefined,
        companyName: company.name,
        setupUrl,
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
