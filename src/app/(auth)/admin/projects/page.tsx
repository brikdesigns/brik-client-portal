import { createClient } from '@/lib/supabase/server';

import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { PageHeader } from '@/components/page-header';
import { ProjectsFilterTable, type ProjectRow } from '@/components/projects-filter-table';
import { space } from '@/lib/tokens';

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id, name, slug, status, description,
      start_date, end_date,
      companies(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Projects query error:', projectsError);
  }

  // Fetch project_services separately to avoid RLS join issues
  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: allProjectServices } = projectIds.length > 0
    ? await supabase
        .from('project_services')
        .select('project_id, services(id, name, base_price_cents, service_categories(slug))')
        .in('project_id', projectIds)
    : { data: [] as { project_id: string; services: { id: string; name: string; base_price_cents: number | null; service_categories: { slug: string } | null } | null }[] };

  const all = projects ?? [];
  const inProgress = all.filter((p) => p.status === 'active').length;
  const completed = all.filter((p) => p.status === 'completed').length;
  const notStarted = all.filter((p) => p.status === 'not_started').length;

  // Build services lookup from separate query
  const servicesByProject = new Map<string, { id: string; name: string; category_slug: string; base_price_cents: number | null }[]>();
  for (const ps of (allProjectServices ?? [])) {
    const svc = ps.services as unknown as { id: string; name: string; base_price_cents: number | null; service_categories: { slug: string } | null } | null;
    if (!svc) continue;
    const existing = servicesByProject.get(ps.project_id) ?? [];
    existing.push({ id: svc.id, name: svc.name, base_price_cents: svc.base_price_cents, category_slug: svc.service_categories?.slug ?? 'service' });
    servicesByProject.set(ps.project_id, existing);
  }

  // Transform for client component
  const projectRows: ProjectRow[] = all.map((p) => {
    const company = p.companies as unknown as { id: string; name: string; slug: string } | null;
    const services = servicesByProject.get(p.id) ?? [];

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
          <LinkButton variant="primary" size="md" href="/admin/projects/new">
            Add Project
          </LinkButton>
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
        <CardSummary label="In Progress" value={inProgress} />
        <CardSummary label="Complete" value={completed} />
        <CardSummary label="Not Started" value={notStarted} />
      </div>

      <ProjectsFilterTable projects={projectRows} clientOptions={clientOptions} />
    </div>
  );
}
