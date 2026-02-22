import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditProjectForm } from '@/components/edit-project-form';
import { PageHeader, Breadcrumb } from '@/components/page-header';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, name, slug, description, status,
      start_date, end_date,
      companies(id, name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const client = project.companies as unknown as { id: string; name: string; slug: string } | null;

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
      />
    </div>
  );
}
