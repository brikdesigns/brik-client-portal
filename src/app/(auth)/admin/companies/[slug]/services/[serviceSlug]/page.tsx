import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { Counter } from '@bds/components/ui/Counter/Counter';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import {
  ServiceStatusBadge,
  ServiceTypeTag,
  ProjectStatusBadge,
} from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { TaskList } from '@/components/task-list';
import { RemoveServiceButton } from '@/components/remove-service-button';
import { formatCurrency } from '@/lib/format';
import { font, color, gap, space } from '@/lib/tokens';
import { detail, heading } from '@/lib/styles';
import { getWorkflowConfig } from '@/lib/tasks/task-config';
import type { ServiceTask } from '@/lib/tasks/task-utils';

interface Props {
  params: Promise<{ slug: string; serviceSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CompanyServiceDetailPage({ params, searchParams }: Props) {
  const { slug, serviceSlug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  // Fetch the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, slug, type')
    .eq('slug', slug)
    .single();

  if (companyError || !company) notFound();

  // Fetch the company_service assignment by joining through the service slug
  const { data: assignments } = await supabase
    .from('company_services')
    .select(`
      id, status, started_at, notes, proposal_id,
      services(id, name, slug, service_type, billing_frequency, base_price_cents, description,
        offering_structure, included_scope,
        service_categories(slug, name)
      )
    `)
    .eq('company_id', company.id);

  // Find the assignment whose service matches the slug
  const assignment = (assignments ?? []).find((a) => {
    const svc = (a as unknown as Record<string, unknown>).services as { slug: string } | null;
    return svc?.slug === serviceSlug;
  });

  if (!assignment) notFound();

  const service = (assignment as unknown as Record<string, unknown>).services as {
    id: string;
    name: string;
    slug: string;
    service_type: string;
    billing_frequency: string | null;
    base_price_cents: number | null;
    description: string | null;
    offering_structure: string | null;
    included_scope: string | null;
    service_categories: { slug: string; name: string } | null;
  };

  const isBundled = service.offering_structure === 'bundled';

  // Fetch bundle child services if this is a bundled service
  const { data: bundleItems } = isBundled
    ? await supabase
        .from('service_bundle_items')
        .select(`
          sort_order,
          services!service_bundle_items_child_service_id_fkey(
            id, name, slug, service_type, base_price_cents, billing_frequency,
            service_categories(slug, name)
          )
        `)
        .eq('parent_service_id', service.id)
        .order('sort_order', { ascending: true })
    : { data: null };

  const childServices = (bundleItems ?? []).map((item) => {
    return (item as unknown as Record<string, unknown>).services as {
      id: string; name: string; slug: string; service_type: string;
      base_price_cents: number | null; billing_frequency: string | null;
      service_categories: { slug: string; name: string } | null;
    };
  }).filter(Boolean);

  // Fetch projects linked to this company_service
  const { data: linkedProjects } = await supabase
    .from('projects')
    .select('id, name, slug, status, start_date, end_date')
    .eq('company_service_id', assignment.id)
    .order('created_at', { ascending: false });

  // Also fetch projects linked via project_services (catalog link) but NOT via company_service_id
  const { data: catalogLinkedProjects } = await supabase
    .from('project_services')
    .select('projects(id, name, slug, status, start_date, end_date, company_service_id)')
    .eq('service_id', service.id);

  const unlinkedProjects = (catalogLinkedProjects ?? [])
    .map((ps) => (ps as unknown as Record<string, unknown>).projects as {
      id: string; name: string; slug: string; status: string;
      start_date: string | null; end_date: string | null;
      company_service_id: string | null;
    } | null)
    .filter((p) => p && !p.company_service_id)
    .filter(Boolean) as { id: string; name: string; slug: string; status: string; start_date: string | null; end_date: string | null }[];

  const allProjects = [
    ...(linkedProjects ?? []),
    ...unlinkedProjects.filter((up) => !(linkedProjects ?? []).some((lp) => lp.id === up.id)),
  ];

  // Check if this service has a workflow config (for the Tasks tab)
  const workflow = getWorkflowConfig(service.slug);

  // Fetch service tasks if workflow exists; auto-initialize on first visit
  let serviceTasks: ServiceTask[] = [];
  if (workflow) {
    const { data: taskRows } = await supabase
      .from('service_tasks')
      .select('*')
      .eq('company_service_id', assignment.id)
      .order('sort_order', { ascending: true });
    serviceTasks = (taskRows ?? []) as ServiceTask[];

    // Auto-initialize tasks from workflow template if none exist yet
    if (serviceTasks.length === 0) {
      const rows: Array<{
        company_service_id: string;
        task_key: string;
        phase: string;
        sort_order: number;
        status: 'not_started';
        metadata: Record<string, never>;
        parent_task_key: string | null;
        is_required: boolean;
      }> = [];

      for (const t of workflow.tasks) {
        rows.push({
          company_service_id: assignment.id,
          task_key: t.key,
          phase: t.phase,
          sort_order: t.sortOrder,
          status: 'not_started',
          metadata: {},
          parent_task_key: null,
          is_required: true,
        });
        if (t.subtasks) {
          for (const st of t.subtasks) {
            rows.push({
              company_service_id: assignment.id,
              task_key: st.key,
              phase: t.phase,
              sort_order: st.sortOrder,
              status: 'not_started',
              metadata: {},
              parent_task_key: t.key,
              is_required: st.required !== false,
            });
          }
        }
      }

      const { data: inserted } = await supabase
        .from('service_tasks')
        .insert(rows)
        .select('*');
      serviceTasks = ((inserted ?? []) as ServiceTask[]).sort((a, b) => a.sort_order - b.sort_order);
    } else {
      // Reconcile: insert any subtask rows that are defined in the template but missing in DB
      // (handles template evolution — adding subtasks to an already-initialized workflow)
      const missingRows: Array<{
        company_service_id: string;
        task_key: string;
        phase: string;
        sort_order: number;
        status: 'not_started';
        metadata: Record<string, never>;
        parent_task_key: string;
        is_required: boolean;
      }> = [];

      for (const t of workflow.tasks) {
        if (!t.subtasks) continue;
        const parentExists = serviceTasks.some((st) => st.task_key === t.key && !st.parent_task_key);
        if (!parentExists) continue;
        for (const sub of t.subtasks) {
          const exists = serviceTasks.some(
            (st) => st.task_key === sub.key && st.parent_task_key === t.key,
          );
          if (!exists) {
            missingRows.push({
              company_service_id: assignment.id,
              task_key: sub.key,
              phase: t.phase,
              sort_order: sub.sortOrder,
              status: 'not_started',
              metadata: {},
              parent_task_key: t.key,
              is_required: sub.required !== false,
            });
          }
        }
      }

      if (missingRows.length > 0) {
        await supabase.from('service_tasks').insert(missingRows);
        // Re-fetch all tasks after reconciliation
        const { data: refreshed } = await supabase
          .from('service_tasks')
          .select('*')
          .eq('company_service_id', assignment.id)
          .order('sort_order', { ascending: true });
        serviceTasks = (refreshed ?? []) as ServiceTask[];
      }
    }
  }

  const categorySlug = service.service_categories?.slug ?? 'service';
  const validTabs = ['overview', 'projects', ...(isBundled ? ['services'] : []), ...(workflow ? ['tasks'] : [])];
  const activeTab = tab && validTabs.includes(tab) ? tab : 'overview';

  const tabStyle = (active: boolean) => ({
    fontFamily: font.family.label,
    fontSize: font.size.body.md,
    fontWeight: font.weight.medium,
    color: active ? color.text.brand : color.text.muted,
    textDecoration: 'none' as const,
    padding: `${gap.sm} 0`,
    borderBottom: active ? `2px solid ${color.text.brand}` : '2px solid transparent',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  });

  const basePath = `/admin/companies/${company.slug}/services/${serviceSlug}`;

  return (
    <div>
      <PageHeader
        title={service.name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: company.name, href: `/admin/companies/${company.slug}` },
              { label: service.name },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: gap.md, alignItems: 'center' }}>
            {service.billing_frequency === 'monthly' && assignment.status !== 'cancelled' && (
              <RemoveServiceButton
                assignmentId={assignment.id}
                serviceName={service.name}
                companySlug={company.slug}
                companyType={(company as unknown as { type: string }).type}
              />
            )}
            <Button
              variant="primary"
              size="sm"
              asLink
              href={`/admin/companies/${company.slug}/projects/new?company_service_id=${assignment.id}`}
            >
              Add Project
            </Button>
          </div>
        }
        metadata={[
          {
            label: 'Category',
            value: (
              <ServiceBadge
                category={categorySlug}
                serviceName={service.name}
                size={20}
              />
            ),
          },
          { label: 'Status', value: <ServiceStatusBadge status={assignment.status} /> },
          { label: 'Type', value: <ServiceTypeTag type={service.service_type} /> },
        ]}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: gap.lg, borderBottom: `1px solid ${color.border.secondary}`, marginBottom: space.xl }}>
        <a href={basePath} style={tabStyle(activeTab === 'overview')}>Overview</a>
        {isBundled && (
          <a href={`${basePath}?tab=services`} style={tabStyle(activeTab === 'services')}>
            Services
            {childServices.length > 0 && (
              <Counter count={childServices.length} status="neutral" size="sm" />
            )}
          </a>
        )}
        <a href={`${basePath}?tab=projects`} style={tabStyle(activeTab === 'projects')}>
          Projects
          {allProjects.length > 0 && (
            <Counter count={allProjects.length} status="neutral" size="sm" />
          )}
        </a>
        {workflow && (() => {
          const parentTasks = serviceTasks.filter((t) => !t.parent_task_key);
          const completedCount = parentTasks.filter((t) => t.status === 'completed').length;
          const allDone = parentTasks.length > 0 && completedCount === parentTasks.length;
          return (
            <a href={`${basePath}?tab=tasks`} style={tabStyle(activeTab === 'tasks')}>
              Tasks
              {parentTasks.length > 0 && (
                <Counter
                  count={parentTasks.length}
                  status={allDone ? 'success' : completedCount > 0 ? 'progress' : 'neutral'}
                  size="sm"
                />
              )}
            </a>
          );
        })()}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
            <div>
              <p style={detail.label}>Price</p>
              <p style={detail.value}>
                {service.base_price_cents
                  ? `${formatCurrency(service.base_price_cents)}${service.billing_frequency === 'monthly' ? '/mo' : ''}`
                  : '—'}
              </p>
            </div>
            <div>
              <p style={detail.label}>Started</p>
              <p style={detail.value}>
                {assignment.started_at
                  ? new Date(assignment.started_at).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <p style={detail.label}>Billing</p>
              <p style={detail.value}>
                {service.billing_frequency
                  ? service.billing_frequency.charAt(0).toUpperCase() + service.billing_frequency.slice(1)
                  : '—'}
              </p>
            </div>
          </div>

          {assignment.notes && (
            <div>
              <p style={detail.label}>Notes</p>
              <p style={{ ...detail.value, lineHeight: font.lineHeight.relaxed, whiteSpace: 'pre-wrap' }}>
                {assignment.notes}
              </p>
            </div>
          )}

          {service.description && (
            <div>
              <p style={detail.label}>Service Description</p>
              <p style={{ ...detail.value, lineHeight: font.lineHeight.relaxed, whiteSpace: 'pre-wrap', color: color.text.secondary }}>
                {service.description}
              </p>
            </div>
          )}

          {service.included_scope && (
            <div>
              <p style={detail.label}>What&apos;s Included</p>
              <p style={{ ...detail.value, lineHeight: font.lineHeight.relaxed, whiteSpace: 'pre-wrap', color: color.text.secondary }}>
                {service.included_scope}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && isBundled && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={{ ...heading.section, margin: 0 }}>Included Services ({childServices.length})</h2>
          </div>

          <DataTable
            data={childServices}
            rowKey={(c) => c.id}
            emptyMessage="No included services"
            emptyDescription="This bundle has no child services configured."
            columns={[
              {
                header: '',
                accessor: (c) => {
                  const catSlug = c.service_categories?.slug;
                  return catSlug ? <ServiceBadge category={catSlug} serviceName={c.name} size={24} /> : null;
                },
                style: { width: '28px', padding: `${space.xs} ${gap.xs} ${space.xs} ${space.sm}` },
              },
              {
                header: 'Service',
                accessor: (c) => (
                  <a href={`/admin/services/${c.slug}`} style={{ color: color.text.primary, textDecoration: 'none' }}>
                    {c.name}
                  </a>
                ),
                style: { fontWeight: font.weight.medium },
              },
              {
                header: 'Type',
                accessor: (c) => <ServiceTypeTag type={c.service_type} />,
              },
              {
                header: 'Price',
                accessor: (c) =>
                  c.base_price_cents
                    ? `${formatCurrency(c.base_price_cents)}${c.billing_frequency === 'monthly' ? '/mo' : ''}`
                    : '—',
                style: { color: color.text.secondary },
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={{ ...heading.section, margin: 0 }}>Projects</h2>
            <Button
              variant="primary"
              size="sm"
              asLink
              href={`/admin/companies/${company.slug}/projects/new?company_service_id=${assignment.id}`}
            >
              Add Project
            </Button>
          </div>

          <DataTable
            data={allProjects}
            rowKey={(p) => p.id}
            emptyMessage="No projects yet"
            emptyDescription="Create a project to start tracking work for this service."
            emptyAction={{
              label: 'Add Project',
              href: `/admin/companies/${company.slug}/projects/new?company_service_id=${assignment.id}`,
            }}
            columns={[
              {
                header: 'Project',
                accessor: (p) => (
                  <a
                    href={`/admin/projects/${p.slug}`}
                    style={{ color: color.text.primary, textDecoration: 'none' }}
                  >
                    {p.name}
                  </a>
                ),
                style: { fontWeight: font.weight.medium },
              },
              {
                header: 'Status',
                accessor: (p) => <ProjectStatusBadge status={p.status} />,
              },
              {
                header: 'Start',
                accessor: (p) =>
                  p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'End',
                accessor: (p) =>
                  p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
                style: { color: color.text.secondary },
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
      )}

      {activeTab === 'tasks' && workflow && (
        <TaskList
          workflow={workflow}
          tasks={serviceTasks}
        />
      )}
    </div>
  );
}
