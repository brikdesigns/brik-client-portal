import { createClient } from '@/lib/supabase/server';
import { InviteUserForm } from '@/components/invite-user-form';
import { PageHeader, Breadcrumb } from '@/components/page-header';

export default async function InviteUserPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('companies')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Invite a User"
        subtitle="Send a portal invitation to a new user."
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Users', href: '/admin/users' },
              { label: 'Invite User' },
            ]}
          />
        }
      />

      <InviteUserForm clients={clients ?? []} />
    </div>
  );
}
