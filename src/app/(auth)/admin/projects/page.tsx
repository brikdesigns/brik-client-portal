import { createClient } from '@/lib/supabase/server';

import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { ProjectsFilterTable, type ProjectRow } from '@/components/projects-filter-table';
import { space } from '@/lib/tokens';

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, slug, status, description,
      start_date, end_date,
      companies(id, name, slug),
      project_services(
        services(id, name, service_categories(slug))
      )
    `)
    .order('created_at', { ascending: false });

  const all = projects ?? [];
  const inProgress = all.filter((p) => p.status === 'active').length;
  const completed = all.filter((p) => p.status === 'completed').length;
  const notStarted = all.filter((p) => p.status === 'not_started').length;

  // Transform for client component
  const projectRows: ProjectRow[] = all.map((p) => {
    const company = p.companies as unknown as { id: string; name: string; slug: string } | null;
    const ps = p.project_services as unknown as {
      services: {
        id: string;
        name: string;
        service_categories: { slug: string } | null;
      } | null;
    }[];

    const services = (ps ?? [])
      .filter((r) => r.services !== null)
      .map((r) => ({
        id: r.services!.id,
        name: r.services!.name,
        category_slug: r.services!.service_categories?.slug ?? 'service',
      }));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      description: p.description,
      start_date: p.start_date,
      end_date: p.end_date,
      company,
      services,
    };
  });

  // Build client filter options
  const clientMap = new Map<string, string>();
  projectRows.forEach((p) => {
    if (p.company) clientMap.set(p.company.id, p.company.name);
  });
  const clientOptions = Array.from(clientMap.entries())
    .map(([id, name]) => ({ label: name, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
          gap: space.md,
          marginBottom: space.xl,
        }}
      >
        <CardSummary label="In progress" value={inProgress} />
        <CardSummary label="Complete" value={completed} />
        <CardSummary label="Not started" value={notStarted} />
      </div>

      <ProjectsFilterTable projects={projectRows} clientOptions={clientOptions} />
    </div>
  );
}
