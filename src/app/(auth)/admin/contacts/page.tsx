import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';

export default async function AdminContactsPage() {
  const supabase = createClient();

  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      full_name,
      email,
      phone,
      title,
      role,
      is_primary,
      user_id,
      companies(name, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People at your companies — clients, managers, and admins."
      />

      <Card variant="elevated" padding="lg">
        <DataTable
          data={contacts ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No contacts yet."
          columns={[
            {
              header: 'Name',
              accessor: (c) => (
                <span style={{ fontWeight: 500, color: 'var(--_color---text--primary)' }}>
                  {c.full_name}
                  {c.is_primary && (
                    <Badge status="info" style={{ marginLeft: '8px' }}>Primary</Badge>
                  )}
                </span>
              ),
            },
            {
              header: 'Company',
              accessor: (c) => {
                const company = c.companies as unknown as { name: string; slug: string } | null;
                return company ? (
                  <TextLink href={`/admin/companies/${company.slug}`} size="small">
                    {company.name}
                  </TextLink>
                ) : '—';
              },
            },
            {
              header: 'Title',
              accessor: (c) => c.title || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Email',
              accessor: (c) => c.email || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Phone',
              accessor: (c) => c.phone || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Role',
              accessor: (c) => (
                <Badge status="neutral">
                  {c.role.charAt(0).toUpperCase() + c.role.slice(1)}
                </Badge>
              ),
            },
            {
              header: 'Portal',
              accessor: (c) => (
                <Badge status={c.user_id ? 'positive' : 'neutral'}>
                  {c.user_id ? 'Active' : 'No access'}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
