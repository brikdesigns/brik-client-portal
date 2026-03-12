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

  // Fetch service lines (categories)
  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, slug')
    .order('name');

  const serviceLines = (categories ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  // Fetch available services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, category_id, service_categories(slug)')
    .eq('active', true)
    .order('name');

  const availableServices = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    category_slug: (s.service_categories as unknown as { slug: string } | null)?.slug ?? 'service',
    category_id: s.category_id ?? '',
  }));

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

      <NewProjectForm
        companies={companies ?? []}
        serviceLines={serviceLines}
        availableServices={availableServices}
      />
    </div>
  );
}
