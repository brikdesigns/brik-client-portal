import { createClient } from '@/lib/supabase/server';

import { Tag } from '@bds/components/ui/Tag/Tag';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { color, font, gap } from '@/lib/tokens';

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
        actions={
          <Button variant="primary" size="sm" asLink href="/admin/contacts/new">
            Add New
          </Button>
        }
      />

      <DataTable
          data={contacts ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No contacts yet."
          columns={[
            {
              header: 'Name',
              accessor: (c) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                  {c.full_name}
                  {c.is_primary && (
                    <Tag size="sm" style={{ color: color.text.muted }}>Primary</Tag>
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
              header: 'Job Title',
              accessor: (c) => c.title || '—',
              style: { color: color.text.secondary, minWidth: '120px' },
            },
            {
              header: 'Email',
              accessor: (c) => c.email || '—',
              style: { color: color.text.secondary },
            },
            {
              header: 'Role',
              accessor: (c) => (
                <Tag size="sm" style={{ color: color.text.muted }}>
                  {c.role.charAt(0).toUpperCase() + c.role.slice(1)}
                </Tag>
              ),
            },
            {
              header: '',
              accessor: (c) => (
                <div style={{ display: 'flex', gap: gap.sm, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${c.id}`}>
                    View
                  </Button>
                  <Button variant="primary" size="sm" asLink href={`/admin/contacts/${c.id}/edit`}>
                    Edit
                  </Button>
                </div>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
    </div>
  );
}
