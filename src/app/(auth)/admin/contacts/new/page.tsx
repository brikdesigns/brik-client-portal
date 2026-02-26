import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { NewContactForm } from '@/components/new-contact-form';

interface Props {
  searchParams: Promise<{ company_id?: string }>;
}

export default async function NewContactPage({ searchParams }: Props) {
  const { company_id } = await searchParams;
  const supabase = createClient();

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Add Contact"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Contacts', href: '/admin/contacts' },
              { label: 'Add Contact' },
            ]}
          />
        }
      />
      <NewContactForm
        companies={companies ?? []}
        defaultCompanyId={company_id}
      />
    </div>
  );
}
