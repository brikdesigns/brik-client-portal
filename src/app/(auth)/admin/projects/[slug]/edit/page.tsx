import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditProjectForm } from '@/components/edit-project-form';
import { PageHeader, Breadcrumb } from '@/components/page-header';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, name, slug, description, status,
      start_date, end_date,
      clickup_task_id, clickup_folder_id, clickup_list_id,
      clickup_assignee, clickup_type, clickup_status,
      companies(id, name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const client = project.companies as unknown as { id: string; name: string; slug: string } | null;

  // Fetch available services for the selector
  const { data: services } = await supabase
    .from('services')
    .select('id, name, service_categories(slug)')
    .eq('active', true)
    .order('name');

  const availableServices = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    category_slug: (s.service_categories as unknown as { slug: string } | null)?.slug ?? 'service',
  }));

  // Fetch currently assigned services
  const { data: projectServices } = await supabase
    .from('project_services')
    .select('service_id')
    .eq('project_id', project.id);

  const assignedServiceIds = (projectServices ?? []).map((ps) => ps.service_id);

  return (
    <div>
      <PageHeader
        title="Edit project"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Projects', href: '/admin/projects' },
              { label: project.name, href: `/admin/projects/${project.slug}` },
              { label: 'Edit' },
            ]}
          />
        }
        subtitle={`Update ${project.name}.`}
      />

      <EditProjectForm
        project={project}
        clientName={client?.name ?? 'Unknown'}
        availableServices={availableServices}
        assignedServiceIds={assignedServiceIds}
      />
    </div>
  );
}
