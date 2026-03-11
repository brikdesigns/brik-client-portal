import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { NewProjectForm } from '@/components/new-project-form';

export default async function NewProjectPage() {
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .neq('status', 'archived')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Add project"
        subtitle="Create a new project for a client."
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Projects', href: '/admin/projects' },
              { label: 'Add project' },
            ]}
          />
        }
      />

      <NewProjectForm companies={companies ?? []} />
    </div>
  );
}
