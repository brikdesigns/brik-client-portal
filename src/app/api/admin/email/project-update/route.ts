import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendProjectUpdateEmail, logEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { project_id, update_message } = await request.json();
  if (!project_id || !update_message) {
    return NextResponse.json({ error: 'project_id and update_message are required' }, { status: 400 });
  }

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
    .select('full_name, email')
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
      recipientName: contact.full_name,
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
