import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { InviteUserForm } from '@/components/invite-user-form';
import { PageHeader, Breadcrumb } from '@/components/page-header';

export default async function InviteUserPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('clients')
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

      <Card variant="elevated" padding="lg">
        <InviteUserForm clients={clients ?? []} />
      </Card>
    </div>
  );
}
