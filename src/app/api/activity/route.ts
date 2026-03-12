import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseBody, isValidationError } from '@/lib/validation';

const VALID_EVENTS = ['login', 'logout', 'password_reset', 'invite_accepted'] as const;

const activitySchema = z.object({
  event_type: z.enum(VALID_EVENTS),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseBody(request, activitySchema);
  if (isValidationError(body)) return body;
  const { event_type } = body;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || null;
  const userAgent = request.headers.get('user-agent') || null;

  // Use service client to insert (RLS allows admin-only inserts)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceClient
    .from('user_activity')
    .insert({
      user_id: user.id,
      event_type,
      ip_address: ip,
      user_agent: userAgent,
    });

  if (error) {
    console.error('Failed to record activity:', error);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
