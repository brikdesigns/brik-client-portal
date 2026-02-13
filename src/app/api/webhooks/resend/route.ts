import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Resend webhook handler for email delivery tracking.
 *
 * Configure in Resend dashboard:
 *   Webhook URL: https://your-site.netlify.app/api/webhooks/resend
 *   Events: email.delivered, email.bounced, email.complained
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  // Map Resend event types to our email_log status values
  const statusMap: Record<string, string> = {
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.complained': 'bounced',
    'email.delivery_delayed': 'sent', // keep as sent, it's still in transit
  };

  const newStatus = statusMap[type];
  if (!newStatus || !data?.email_id) {
    return NextResponse.json({ received: true });
  }

  // Update the email_log entry
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('email_log')
    .update({
      status: newStatus,
      metadata: {
        resend_event: type,
        timestamp: data.created_at,
      },
    })
    .eq('resend_id', data.email_id);

  return NextResponse.json({ received: true });
}
