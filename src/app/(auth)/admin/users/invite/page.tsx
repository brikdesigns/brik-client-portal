import { createClient } from '@/lib/supabase/server';
import { InviteUserForm } from '@/components/invite-user-form';
import { PageHeader, Breadcrumb } from '@/components/page-header';

export default async function InviteUserPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('companies')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  return (
    <div>
      <PageHeader
        title="Invite a user"
        subtitle="Send a portal invitation to a new user."
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Users', href: '/admin/users' },
              { label: 'Invite user' },
            ]}
          />
        }
      />

      <InviteUserForm clients={clients ?? []} />
    </div>
  );
}
