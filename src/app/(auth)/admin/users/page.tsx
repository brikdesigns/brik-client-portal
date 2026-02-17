import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { RoleTag } from '@/components/status-badges';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';

export default async function AdminUsersPage() {
  const supabase = createClient();

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
      <PageHeader
        title="Users"
        subtitle="Manage portal access and send invitations."
        actions={
          <Button variant="primary" size="md" asLink href="/admin/users/invite">
            Invite user
          </Button>
        }
      />

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
              accessor: (u) => <RoleTag role={u.role} />,
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
              style: { color: 'var(--_color---text--muted)' },
            },
            {
              header: '',
              accessor: (u) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/users/${u.id}/edit`}>
                  Edit
                </Button>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
