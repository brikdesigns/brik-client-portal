import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendProjectUpdateEmail, logEmail } from '@/lib/email';
import { parseBody, isValidationError, uuidSchema, nonEmptyString } from '@/lib/validation';
import { rateLimitOrNull, ADMIN_EMAIL_LIMIT } from '@/lib/rate-limit';

const projectUpdateSchema = z.object({
  project_id: uuidSchema,
  update_message: nonEmptyString,
});

export async function POST(request: Request) {
  const limited = rateLimitOrNull(request, 'email-project-update', ADMIN_EMAIL_LIMIT);
  if (limited) return limited;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await parseBody(request, projectUpdateSchema);
  if (isValidationError(body)) return body;
  const { project_id, update_message } = body;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: project, error: projectError } = await serviceClient
    .from('projects')
    .select('id, name, status, company_id, companies(id, name)')
    .eq('id', project_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const company = project.companies as unknown as { id: string; name: string };

  const { data: contact } = await serviceClient
    .from('contacts')
    .select('first_name, email')
    .eq('company_id', project.company_id)
    .eq('is_primary', true)
    .not('email', 'is', null)
    .single();

  if (!contact?.email) {
    return NextResponse.json({ error: 'No primary contact with email found for this company' }, { status: 400 });
  }

  try {
    const result = await sendProjectUpdateEmail({
      to: contact.email,
      recipientName: contact.first_name,
      companyName: company.name,
      projectName: project.name,
      projectStatus: project.status || 'In progress',
      updateMessage: update_message,
    });

    await logEmail(serviceClient, {
      to: contact.email,
      subject: `Update on your project: ${project.name}`,
      template: 'project_update',
      resendId: result?.id,
      companyId: project.company_id,
    });

    return NextResponse.json({ success: true, email_id: result?.id });
  } catch (err) {
    console.error('Failed to send project update email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
