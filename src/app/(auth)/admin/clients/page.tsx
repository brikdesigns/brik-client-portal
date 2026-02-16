import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ClientStatusBadge } from '@/components/status-badges';

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      slug,
      status,
      contact_email,
      contact_name,
      created_at,
      projects(id),
      invoices(id, status)
    `)
    .order('name');

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts and portal access."
        action={
          <a href="/admin/clients/new">
            <Button variant="primary" size="md">
              Add client
            </Button>
          </a>
        }
      />

      <Card variant="elevated" padding="lg">
        <DataTable
          data={clients ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No clients yet. Add your first client to get started."
          columns={[
            {
              header: 'Client',
              accessor: (c) => c.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Contact',
              accessor: (c) => c.contact_email || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Projects',
              accessor: (c) =>
                Array.isArray(c.projects) ? c.projects.length : 0,
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Open invoices',
              accessor: (c) =>
                Array.isArray(c.invoices)
                  ? c.invoices.filter((inv: { status: string }) => inv.status === 'open').length
                  : 0,
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (c) => <ClientStatusBadge status={c.status} />,
            },
            {
              header: '',
              accessor: (c) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/clients/${c.slug}`}>
                  View Details
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
