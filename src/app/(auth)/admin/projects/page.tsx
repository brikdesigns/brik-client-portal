import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProjectStatusBadge } from '@/components/status-badges';

export default async function AdminProjectsPage() {
  const supabase = createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, slug, status, description,
      start_date, end_date,
      companies(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const all = projects ?? [];
  const inProgress = all.filter((p) => p.status === 'active').length;
  const completed = all.filter((p) => p.status === 'completed').length;
  const notStarted = all.filter((p) => p.status === 'not_started').length;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${all.length} total projects across all clients.`}
        actions={
          <Button variant="primary" size="md" asLink href="/admin/projects/new">
            Add project
          </Button>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <CardSummary label="In progress" value={inProgress} />
        <CardSummary label="Complete" value={completed} />
        <CardSummary label="Not started" value={notStarted} />
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={all}
          rowKey={(p) => p.id}
          emptyMessage="No projects yet. Add one to get started."
          columns={[
            {
              header: 'Project',
              accessor: (p) => (
                <a
                  href={`/admin/projects/${p.slug}`}
                  style={{ color: 'var(--_color---text--primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {p.name}
                </a>
              ),
            },
            {
              header: 'Client',
              accessor: (p) => {
                const client = p.companies as unknown as { id: string; name: string; slug: string } | null;
                return client ? (
                  <a
                    href={`/admin/companies/${client.slug}`}
                    style={{ color: 'var(--_color---system--link, #0034ea)', textDecoration: 'none', fontSize: '13px' }}
                  >
                    {client.name}
                  </a>
                ) : '—';
              },
            },
            {
              header: 'Status',
              accessor: (p) => <ProjectStatusBadge status={p.status} />,
            },
            {
              header: 'Start',
              accessor: (p) => p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: 'End',
              accessor: (p) => p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)', fontSize: '13px' },
            },
            {
              header: '',
              accessor: (p) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/projects/${p.slug}`}>
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
