import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Banner } from '@bds/components/ui/Banner/Banner';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProjectStatusBadge } from '@/components/status-badges';
import { heading } from '@/lib/styles';
import { border, color, gap, space } from '@/lib/tokens';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [leadsRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('type', 'lead'),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('type', 'client'),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  const stats = [
    { label: 'Leads', value: leadsRes.count ?? 0, href: '/admin/companies?type=lead' },
    { label: 'Clients', value: clientsRes.count ?? 0, href: '/admin/companies?type=client' },
    { label: 'Projects', value: projectsRes.count ?? 0, href: '/admin/projects' },
    { label: 'Open invoices', value: invoicesRes.count ?? 0, href: '/admin/invoices' },
  ];

  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, name, slug, status, companies(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader title="Overview" subtitle="Portal activity and quick stats." />

      <Banner
        title="Want to set up a new client?"
        description="Click to begin the setup workflow for new clients."
        action={
          <Button
            variant="primary"
            size="sm"
            asLink
            href="/admin/companies/new"
            style={{
              backgroundColor: color.background.onColorDark,
            }}
          >
            Get started
          </Button>
        }
        style={{ marginBottom: space.xl, borderRadius: border.radius.md }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: gap.lg,
          marginBottom: space.xl,
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

      <h2 style={heading.section}>Recent projects</h2>

      <DataTable
        data={recentProjects ?? []}
        rowKey={(p) => p.id}
        emptyMessage="No projects yet. Create your first client to get started."
        columns={[
          {
            header: 'Project',
            accessor: (p) => p.name,
            style: { color: color.text.primary, fontWeight: 500 },
          },
          {
            header: 'Company',
            accessor: (p) =>
              (p.companies as unknown as { name: string } | null)?.name ?? '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'Status',
            accessor: (p) => <ProjectStatusBadge status={p.status} />,
          },
          {
            header: '',
            accessor: (p) => (
              <Button variant="secondary" size="sm" asLink href={`/admin/projects/${p.slug}`}>
                View
              </Button>
            ),
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
