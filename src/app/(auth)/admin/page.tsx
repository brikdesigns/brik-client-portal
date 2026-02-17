import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProjectStatusBadge } from '@/components/status-badges';

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [clientsRes, projectsRes, invoicesRes, usersRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
  ]);

  const stats = [
    { label: 'Active clients', value: clientsRes.count ?? 0, href: '/admin/clients' },
    { label: 'Projects', value: projectsRes.count ?? 0, href: '/admin/clients' },
    { label: 'Open invoices', value: invoicesRes.count ?? 0, href: '/admin/invoices' },
    { label: 'Portal users', value: usersRes.count ?? 0, href: '/admin/users' },
  ];

  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, name, status, clients(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader title="Overview" subtitle="Portal activity and quick stats." />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {stats.map((stat) => (
          <CardSummary
            key={stat.label}
            label={stat.label}
            value={stat.value}
            textLink={{ label: 'View details', href: stat.href }}
          />
        ))}
      </div>

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
          Recent projects
        </h2>

        <DataTable
          data={recentProjects ?? []}
          rowKey={(p) => p.id}
          emptyMessage="No projects yet. Create your first client to get started."
          columns={[
            {
              header: 'Project',
              accessor: (p) => p.name,
              style: { color: 'var(--_color---text--primary)', fontWeight: 500 },
            },
            {
              header: 'Client',
              accessor: (p) =>
                (p.clients as unknown as { name: string } | null)?.name ?? '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (p) => <ProjectStatusBadge status={p.status} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
