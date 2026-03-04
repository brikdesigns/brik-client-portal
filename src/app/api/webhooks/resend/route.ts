import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resend webhook handler for email delivery tracking.
 *
 * Configure in Resend dashboard:
 *   Webhook URL: https://portal.brikdesigns.com/api/webhooks/resend
 *   Events: email.delivered, email.bounced, email.complained
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  // Signature verification (skip in dev if secret not set)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
    }

    // Replay protection: reject timestamps older than 5 minutes
    const timestampMs = parseInt(svixTimestamp) * 1000;
    if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
    }

    // Compute expected signature
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const secretBytes = Buffer.from(webhookSecret.replace('whsec_', ''), 'base64');
    const hmac = createHmac('sha256', secretBytes);
    hmac.update(signedContent);
    const expectedSig = `v1,${hmac.digest('base64')}`;

    // svix-signature may contain multiple signatures separated by spaces
    const signatures = svixSignature.split(' ');
    const isValid = signatures.some((sig) => {
      try {
        return timingSafeEqual(
          Buffer.from(sig),
          Buffer.from(expectedSig)
        );
      } catch {
        return false;
      }
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('[webhook] RESEND_WEBHOOK_SECRET not set — skipping verification');
  }

  const { type, data } = JSON.parse(rawBody);

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
