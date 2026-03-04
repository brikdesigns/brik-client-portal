import { Resend } from 'resend';
import { formatCurrency } from './format';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = 'Brik Designs <noreply@brikdesigns.com>';

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

/**
 * Send a portal invitation email to a new user.
 */
export async function sendInviteEmail({
  to,
  inviteeName,
  inviterName,
}: {
  to: string;
  inviteeName?: string;
  inviterName?: string;
}) {
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi,';
  const invitedBy = inviterName ? ` ${inviterName} from` : '';

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'You\'ve been invited to the Brik Designs client portal',
    html: buildEmailHtml({
      heading: 'Welcome to Brik Designs',
      body: `
        <p>${greeting}</p>
        <p>${invitedBy} Brik Designs has invited you to the client portal, where you can track your projects, view invoices, and stay up to date.</p>
        <p>Check your inbox for a separate email from Supabase with your login link. Use it to set your password and access your account.</p>
      `,
    }),
  });

  if (error) {
    console.error('Failed to send invite email:', error);
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Invoice due
// ---------------------------------------------------------------------------

export async function sendInvoiceDueEmail({
  to,
  recipientName,
  companyName,
  invoiceDescription,
  amountCents,
  dueDate,
  invoiceUrl,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  invoiceDescription: string;
  amountCents: number;
  dueDate: string;
  invoiceUrl?: string;
}) {
  const greeting = recipientName ? `Hi ${recipientName},` : `Hi,`;
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invoice due: ${invoiceDescription} — ${formatCurrency(amountCents)}`,
    html: buildEmailHtml({
      heading: 'Invoice due',
      body: `
        <p>${greeting}</p>
        <p>This is a reminder that the following invoice for <strong>${companyName}</strong> is due:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="padding: 12px 16px; background-color: #f9f9f9; border-radius: 6px;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #1b1b1b;">${invoiceDescription}</p>
              <p style="margin: 0; color: #555;">Amount: <strong>${formatCurrency(amountCents)}</strong> &middot; Due: ${formattedDate}</p>
            </td>
          </tr>
        </table>
      `,
      ctaLabel: invoiceUrl ? 'View invoice' : undefined,
      ctaUrl: invoiceUrl,
    }),
  });

  if (error) {
    console.error('Failed to send invoice due email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Payment received
// ---------------------------------------------------------------------------

export async function sendPaymentReceivedEmail({
  to,
  recipientName,
  companyName,
  invoiceDescription,
  amountCents,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  invoiceDescription: string;
  amountCents: number;
}) {
  const greeting = recipientName ? `Hi ${recipientName},` : `Hi,`;

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Payment received — thank you, ${companyName}`,
    html: buildEmailHtml({
      heading: 'Payment received',
      body: `
        <p>${greeting}</p>
        <p>We've received your payment of <strong>${formatCurrency(amountCents)}</strong> for <strong>${invoiceDescription}</strong>.</p>
        <p>Thank you for your prompt payment. You can view your full payment history in the client portal.</p>
      `,
      ctaLabel: 'View payments',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com'}/dashboard/payments`,
    }),
  });

  if (error) {
    console.error('Failed to send payment received email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Project update
// ---------------------------------------------------------------------------

export async function sendProjectUpdateEmail({
  to,
  recipientName,
  companyName,
  projectName,
  projectStatus,
  updateMessage,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  projectName: string;
  projectStatus: string;
  updateMessage: string;
}) {
  const greeting = recipientName ? `Hi ${recipientName},` : `Hi,`;

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Update on your project: ${projectName}`,
    html: buildEmailHtml({
      heading: `Project update: ${projectName}`,
      body: `
        <p>${greeting}</p>
        <p>Here's an update on the <strong>${projectName}</strong> project for ${companyName}:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="padding: 12px 16px; background-color: #f9f9f9; border-radius: 6px;">
              <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #828282;">Status: ${projectStatus}</p>
              <p style="margin: 0; color: #333; line-height: 1.6;">${updateMessage}</p>
            </td>
          </tr>
        </table>
      `,
      ctaLabel: 'View in portal',
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com'}/dashboard`,
    }),
  });

  if (error) {
    console.error('Failed to send project update email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Proposal sent
// ---------------------------------------------------------------------------

export async function sendProposalEmail({
  to,
  recipientName,
  companyName,
  proposalUrl,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  proposalUrl: string;
}) {
  const greeting = recipientName ? `Hi ${recipientName},` : `Hi,`;

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${companyName} — Your proposal from Brik Designs is ready`,
    html: buildEmailHtml({
      heading: 'Your proposal is ready',
      body: `
        <p>${greeting}</p>
        <p>We've prepared a proposal for <strong>${companyName}</strong>. Click below to review the details, scope, and pricing.</p>
        <p style="color: #828282; font-size: 13px;">This link is unique to your proposal and does not require a login.</p>
      `,
      ctaLabel: 'View proposal',
      ctaUrl: proposalUrl,
    }),
  });

  if (error) {
    console.error('Failed to send proposal email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Newsletter / client update
// ---------------------------------------------------------------------------

export async function sendNewsletterEmail({
  to,
  recipientName,
  subject,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  to: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const greeting = recipientName ? `<p>Hi ${recipientName},</p>` : '';

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: buildEmailHtml({
      heading: subject,
      body: `${greeting}${bodyHtml}`,
      ctaLabel,
      ctaUrl,
    }),
  });

  if (error) {
    console.error('Failed to send newsletter email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/**
 * Log an email send to the email_log table.
 */
export async function logEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => { insert: (data: Record<string, unknown>) => any } },
  {
    to,
    subject,
    template,
    resendId,
    companyId,
  }: {
    to: string;
    subject: string;
    template: string;
    resendId?: string;
    companyId?: string;
  }
) {
  await supabase.from('email_log').insert({
    to_email: to,
    subject,
    template,
    status: 'sent',
    resend_id: resendId,
    company_id: companyId || null,
  });
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

/**
 * Build a branded HTML email using Brik Designs style.
 */
function buildEmailHtml({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const ctaBlock = ctaLabel && ctaUrl
    ? `
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="${ctaUrl}" style="display: inline-block; padding: 12px 28px; background-color: #E35335; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${ctaLabel}</a>
            </td>
          </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f0ec; font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <img src="https://brikdesigns.com/images/brik-logo.svg" alt="Brik Designs" width="120" style="display: inline-block;" />
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td style="padding: 24px 40px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1b1b1b;">${heading}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 16px 40px 24px; font-size: 14px; line-height: 1.6; color: #333333;">
              ${body}
            </td>
          </tr>
          <!-- CTA Button -->
          ${ctaBlock}
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #828282; text-align: center;">
              Brik Designs &middot; brikdesigns.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
