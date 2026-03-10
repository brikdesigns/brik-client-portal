import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { EditOpportunitiesForm } from '@/components/edit-opportunities-form';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditOpportunitiesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, slug, pipeline, pipeline_stage, opportunity_owner, followers, introduction_date, ghl_contact_id, ghl_tags, ghl_source, ghl_opportunity_value_cents, ghl_last_synced')
    .eq('slug', slug)
    .single();

  if (error || !company) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Edit Opportunities"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: company.name, href: `/admin/companies/${company.slug}` },
              { label: 'Edit Opportunities' },
            ]}
          />
        }
      />

      <EditOpportunitiesForm company={company as Parameters<typeof EditOpportunitiesForm>[0]['company']} />
    </div>
  );
}
