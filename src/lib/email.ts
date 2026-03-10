import { Resend } from 'resend';
import { formatCurrency } from './format';
import InviteEmail from '@/emails/invite';
import ProposalSentEmail from '@/emails/proposal-sent';
import InvoiceDueEmail from '@/emails/invoice-due';
import PaymentReceivedEmail from '@/emails/payment-received';
import ProjectUpdateEmail from '@/emails/project-update';
import NewsletterEmail from '@/emails/newsletter';
import AgreementSentEmail from '@/emails/agreement-sent';
import AgreementSignedEmail from '@/emails/agreement-signed';
import ProposalAcceptedEmail from '@/emails/proposal-accepted';
import AnalysisCompleteEmail from '@/emails/analysis-complete';
import WelcomeToBrikEmail from '@/emails/welcome-to-brik';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = 'Brik Designs <contact@brikdesigns.com>';

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

export async function sendInviteEmail({
  to,
  inviteeName,
  inviterName,
}: {
  to: string;
  inviteeName?: string;
  inviterName?: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'You\'ve been invited to the Brik Designs client portal',
    react: InviteEmail({ inviteeName, inviterName }),
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
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invoice due: ${invoiceDescription} — ${formatCurrency(amountCents)}`,
    react: InvoiceDueEmail({
      recipientName,
      companyName,
      invoiceDescription,
      formattedAmount: formatCurrency(amountCents),
      formattedDate,
      invoiceUrl,
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
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Payment received — thank you, ${companyName}`,
    react: PaymentReceivedEmail({
      recipientName,
      invoiceDescription,
      formattedAmount: formatCurrency(amountCents),
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
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Update on your project: ${projectName}`,
    react: ProjectUpdateEmail({
      recipientName,
      companyName,
      projectName,
      projectStatus,
      updateMessage,
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
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Brik Designs sent you a proposal',
    react: ProposalSentEmail({
      recipientName,
      companyName,
      proposalUrl,
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
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react: NewsletterEmail({
      recipientName,
      subject,
      bodyHtml,
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
// Agreement sent (to client)
// ---------------------------------------------------------------------------

export async function sendAgreementEmail({
  to,
  recipientName,
  companyName,
  agreementTitle,
  agreementUrl,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  agreementTitle: string;
  agreementUrl: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${companyName} — Your agreement from Brik Designs is ready to sign`,
    react: AgreementSentEmail({
      recipientName,
      companyName,
      agreementTitle,
      agreementUrl,
    }),
  });

  if (error) {
    console.error('Failed to send agreement email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Agreement signed (admin notification)
// ---------------------------------------------------------------------------

export async function sendAgreementSignedEmail({
  to,
  companyName,
  agreementTitle,
  signedByName,
  signedByEmail,
  signedAt,
  companySlug,
}: {
  to: string;
  companyName: string;
  agreementTitle: string;
  signedByName: string;
  signedByEmail: string;
  signedAt: string;
  companySlug: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Agreement signed: ${companyName} — ${agreementTitle}`,
    react: AgreementSignedEmail({
      companyName,
      agreementTitle,
      signedByName,
      signedByEmail,
      signedAt,
      companySlug,
    }),
  });

  if (error) {
    console.error('Failed to send agreement signed email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Proposal accepted (admin notification)
// ---------------------------------------------------------------------------

export async function sendProposalAcceptedEmail({
  to,
  recipientName,
  companyName,
  companySlug,
  proposalId,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  companySlug: string;
  proposalId: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Proposal signed: ${companyName}`,
    react: ProposalAcceptedEmail({
      recipientName,
      companyName,
      companySlug,
      proposalId,
    }),
  });

  if (error) {
    console.error('Failed to send proposal accepted email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Analysis complete (admin notification)
// ---------------------------------------------------------------------------

export async function sendAnalysisCompleteEmail({
  to,
  recipientName,
  companyName,
  companySlug,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  companySlug: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Marketing analysis is ready for ${companyName}`,
    react: AnalysisCompleteEmail({
      recipientName,
      companyName,
      companySlug,
    }),
  });

  if (error) {
    console.error('Failed to send analysis complete email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Welcome to Brik (sent to prospect on proposal acceptance)
// ---------------------------------------------------------------------------

export async function sendWelcomeToBrikEmail({
  to,
  recipientName,
  companyName,
  setupUrl,
}: {
  to: string;
  recipientName?: string;
  companyName: string;
  setupUrl?: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Brik!',
    react: WelcomeToBrikEmail({
      recipientName,
      companyName,
      setupUrl,
    }),
  });

  if (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

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
