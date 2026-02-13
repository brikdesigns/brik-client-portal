import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { InviteUserForm } from '@/components/invite-user-form';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      is_active,
      last_login_at,
      invited_at,
      clients(name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage portal access and send invitations." />

      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--small, 18px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 16px',
          }}
        >
          Invite a user
        </h2>
        <InviteUserForm clients={clients ?? []} />
      </Card>

      <Card variant="elevated" padding="lg">
        <h2
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--small, 18px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 16px',
          }}
        >
          All users
        </h2>

        <DataTable
          data={users ?? []}
          rowKey={(u) => u.id}
          emptyMessage="No users yet."
          columns={[
            {
              header: 'Name',
              accessor: (u) => u.full_name || '—',
              style: { color: 'var(--_color---text--primary)', fontWeight: 500 },
            },
            {
              header: 'Email',
              accessor: (u) => u.email,
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Role',
              accessor: (u) => (
                <Badge status={u.role === 'admin' ? 'info' : 'default'}>
                  {u.role}
                </Badge>
              ),
            },
            {
              header: 'Client',
              accessor: (u) =>
                (u.clients as unknown as { name: string } | null)?.name ?? '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (u) => (
                <Badge status={u.is_active ? 'positive' : 'warning'}>
                  {u.is_active ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              header: 'Last login',
              accessor: (u) =>
                u.last_login_at
                  ? new Date(u.last_login_at).toLocaleDateString()
                  : 'Never',
              style: { color: 'var(--_color---text--muted)', fontSize: '13px' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
