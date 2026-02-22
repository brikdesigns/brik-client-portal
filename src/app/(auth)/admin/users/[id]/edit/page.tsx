import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { EditUserForm } from '@/components/edit-user-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  // Fetch user data
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, company_id')
    .eq('id', id)
    .single();

  if (error || !user) {
    notFound();
  }

  // Fetch all clients for the dropdown
  const { data: clients } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Edit User"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Users', href: '/admin/users' },
              { label: user.full_name || user.email, href: `/admin/users/${id}` },
              { label: 'Edit' },
            ]}
          />
        }
        subtitle={user.email}
      />

      <EditUserForm user={user} clients={clients ?? []} />
    </div>
  );
}
