import { createClient } from '@/lib/supabase/server';

import { Badge } from '@bds/components/ui/Badge/Badge';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { RoleTag } from '@/components/status-badges';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { heading } from '@/lib/styles';
import { color, font } from '@/lib/tokens';

export default async function AdminUsersPage() {
  const supabase = await createClient();

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
      companies(name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage portal access and send invitations."
        actions={
          <LinkButton variant="primary" size="md" href="/admin/users/invite">
            Invite User
          </LinkButton>
        }
      />

      <h2 style={heading.section}>All Users</h2>

      <DataTable
        data={users ?? []}
        rowKey={(u) => u.id}
        emptyMessage="No users yet"
        emptyDescription="Invite your first user to grant portal access."
        emptyAction={{ label: 'Invite User', href: '/admin/users/invite' }}
        columns={[
          {
            header: 'Name',
            accessor: (u) => u.full_name || '—',
            style: { color: color.text.primary, fontWeight: font.weight.medium },
          },
          {
            header: 'Email',
            accessor: (u) => u.email,
            style: { color: color.text.secondary },
          },
          {
            header: 'Role',
            accessor: (u) => <RoleTag role={u.role} />,
          },
          {
            header: 'Client',
            accessor: (u) =>
              (u.companies as unknown as { name: string } | null)?.name ?? '—',
            style: { color: color.text.secondary },
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
            header: 'Last Login',
            accessor: (u) =>
              u.last_login_at
                ? new Date(u.last_login_at).toLocaleDateString()
                : 'Never',
            style: { color: color.text.muted },
          },
          {
            header: '',
            accessor: (u) => (
              <LinkButton variant="secondary" size="sm" href={`/admin/users/${u.id}/edit`}>
                Edit
              </LinkButton>
            ),
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
