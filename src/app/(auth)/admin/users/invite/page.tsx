import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { InviteUserForm } from '@/components/invite-user-form';
import { PageHeader } from '@/components/page-header';

export default async function InviteUserPage() {
  const supabase = await createClient();

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
        action={
          <a
            href="/admin/users"
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '13px',
              color: 'var(--_color---system--link, #0034ea)',
              textDecoration: 'none',
            }}
          >
            Back to users
          </a>
        }
      />

      <Card variant="elevated" padding="lg">
        <InviteUserForm clients={clients ?? []} />
      </Card>
    </div>
  );
}
