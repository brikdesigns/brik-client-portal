import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { EditContactForm } from '@/components/edit-contact-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, title, role, is_primary, notes, company_id')
    .eq('id', id)
    .single();

  if (error || !contact) {
    notFound();
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Edit Contact"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Contacts', href: '/admin/contacts' },
              { label: contact.full_name, href: `/admin/contacts/${contact.id}` },
              { label: 'Edit' },
            ]}
          />
        }
      />
      <EditContactForm
        contact={contact}
        companies={companies ?? []}
      />
    </div>
  );
}
