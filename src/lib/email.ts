import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = 'Brik Designs <noreply@brikdesigns.com>';

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
  }: {
    to: string;
    subject: string;
    template: string;
    resendId?: string;
  }
) {
  await supabase.from('email_log').insert({
    to_email: to,
    subject,
    template,
    status: 'sent',
    resend_id: resendId,
  });
}

/**
 * Build a branded HTML email using Brik Designs style.
 */
function buildEmailHtml({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
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
            <td style="padding: 16px 40px 32px; font-size: 14px; line-height: 1.6; color: #333333;">
              ${body}
            </td>
          </tr>
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
