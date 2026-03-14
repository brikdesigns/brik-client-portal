import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProjectStatusBadge } from '@/components/status-badges';
import { ServiceBadge, ServiceCategoryLabel } from '@/components/service-badge';
import { DeleteProjectButton } from '@/components/delete-project-button';
import { formatCurrency } from '@/lib/format';
import { color, gap, space, font, border } from '@/lib/tokens';
import { detail, heading } from '@/lib/styles';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, name, slug, status, description,
      start_date, end_date, notion_page_id, clickup_task_id,
      clickup_folder_id, clickup_list_id, clickup_assignee, clickup_type, clickup_status,
      created_at,
      companies(id, name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const client = project.companies as unknown as { id: string; name: string; slug: string } | null;

  // Fetch assigned services
  const { data: projectServices } = await supabase
    .from('project_services')
    .select('services(id, name, slug, base_price_cents, billing_frequency, service_categories(slug, name))')
    .eq('project_id', project.id);

  const services = (projectServices ?? [])
    .map((ps) => {
      const svc = (ps as unknown as { services: { id: string; name: string; slug: string; base_price_cents: number | null; billing_frequency: string | null; service_categories: { slug: string; name: string } | null } | null }).services;
      if (!svc) return null;
      return {
        id: svc.id,
        name: svc.name,
        slug: svc.slug,
        base_price_cents: svc.base_price_cents,
        billing_frequency: svc.billing_frequency,
        category_slug: svc.service_categories?.slug ?? 'service',
        category_name: svc.service_categories?.name ?? null,
      };
    })
    .filter(Boolean) as { id: string; name: string; slug: string; base_price_cents: number | null; billing_frequency: string | null; category_slug: string; category_name: string | null }[];

  // Aggregate pricing
  const oneTimeCents = services
    .filter((s) => s.billing_frequency !== 'monthly' && s.base_price_cents)
    .reduce((sum, s) => sum + (s.base_price_cents ?? 0), 0);
  const monthlyCents = services
    .filter((s) => s.billing_frequency === 'monthly' && s.base_price_cents)
    .reduce((sum, s) => sum + (s.base_price_cents ?? 0), 0);
  const totalEstimateCents = oneTimeCents + monthlyCents;

  const metadataItems = [
    {
      label: 'Client',
      value: client ? (
        <a
          href={`/admin/companies/${client.slug}`}
          style={detail.link}
        >
          {client.name}
        </a>
      ) : '—',
    },
    {
      label: 'Start Date',
      value: project.start_date ? new Date(project.start_date).toLocaleDateString() : '—',
    },
    {
      label: 'End Date',
      value: project.end_date ? new Date(project.end_date).toLocaleDateString() : '—',
    },
  ];

  const hasClickupDetails = project.clickup_folder_id || project.clickup_list_id ||
    project.clickup_assignee || project.clickup_type || project.clickup_status;

  // Tab configuration
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'services', label: 'Services' },
  ];
  const activeTab = tab && tabs.some((t) => t.key === tab) ? tab : 'overview';

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

  return (
    <div>
      <PageHeader
        title={project.name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Projects', href: '/admin/projects' },
              { label: project.name },
            ]}
          />
        }
        subtitle={project.description || undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
            <LinkButton variant="secondary" size="sm" href={`/admin/projects/${project.slug}/edit`}>
              Edit
            </LinkButton>
          </div>
        }
        metadata={metadataItems}
      />

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: gap.xl,
          borderBottom: `${border.width.lg} solid ${color.border.muted}`,
          marginBottom: space.lg,
        }}
      >
        {tabs.map((t) => (
          <a key={t.key} href={`/admin/projects/${project.slug}?tab=${t.key}`} style={tabStyle(activeTab === t.key)}>
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          <h2 style={detail.sectionHeading}>Project Details</h2>
          <div style={detail.grid}>
            <div>
              <p style={detail.label}>Status</p>
              <p style={detail.value}><ProjectStatusBadge status={project.status} /></p>
            </div>
            <div>
              <p style={detail.label}>Created</p>
              <p style={detail.value}>
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p style={detail.label}>Notion</p>
              <p style={detail.value}>
                {project.notion_page_id ? (
                  <a
                    href={`https://notion.so/${project.notion_page_id.replace(/-/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={detail.link}
                  >
                    Open in Notion &#x2197;
                  </a>
                ) : (
                  <span style={detail.empty}>—</span>
                )}
              </p>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <p style={detail.label}>Description</p>
              <p style={detail.value}>
                {project.description}
              </p>
            </div>
          )}

          {/* Pricing */}
          {services.length > 0 && (
            <div>
              <h2 style={detail.sectionHeading}>Pricing</h2>
              <div style={{ ...detail.grid, paddingTop: space.md }}>
                {oneTimeCents > 0 && (
                  <div>
                    <p style={detail.label}>One-Time</p>
                    <p style={detail.value}>{formatCurrency(oneTimeCents)}</p>
                  </div>
                )}
                {monthlyCents > 0 && (
                  <div>
                    <p style={detail.label}>Monthly Recurring</p>
                    <p style={detail.value}>{formatCurrency(monthlyCents)}/mo</p>
                  </div>
                )}
                <div>
                  <p style={detail.label}>Estimated Total</p>
                  <p style={{ ...detail.value, fontWeight: font.weight.semibold }}>
                    {totalEstimateCents > 0 ? formatCurrency(totalEstimateCents) : <span style={detail.empty}>—</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ClickUp */}
          {(project.clickup_task_id || hasClickupDetails) && (
            <div>
              <h2 style={detail.sectionHeading}>ClickUp Details</h2>
              <div style={{ ...detail.grid, paddingTop: space.md }}>
                <div>
                  <p style={detail.label}>Task</p>
                  <p style={detail.value}>
                    {project.clickup_task_id ? (
                      <a
                        href={`https://app.clickup.com/t/${project.clickup_task_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={detail.link}
                      >
                        {project.clickup_task_id} &#x2197;
                      </a>
                    ) : (
                      <span style={detail.empty}>—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p style={detail.label}>Folder</p>
                  <p style={detail.value}>{project.clickup_folder_id || <span style={detail.empty}>—</span>}</p>
                </div>
                <div>
                  <p style={detail.label}>List</p>
                  <p style={detail.value}>{project.clickup_list_id || <span style={detail.empty}>—</span>}</p>
                </div>
                <div>
                  <p style={detail.label}>Assignee</p>
                  <p style={detail.value}>{project.clickup_assignee || <span style={detail.empty}>—</span>}</p>
                </div>
                <div>
                  <p style={detail.label}>Type</p>
                  <p style={detail.value}>{project.clickup_type || <span style={detail.empty}>—</span>}</p>
                </div>
                <div>
                  <p style={detail.label}>Status</p>
                  <p style={detail.value}>{project.clickup_status || <span style={detail.empty}>—</span>}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Services Tab ──────────────────────────────────────── */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={heading.section}>Services</h2>
          </div>
          {services.length > 0 ? (
            <DataTable
              data={services}
              rowKey={(svc) => svc.id}
              columns={[
                {
                  header: 'Service',
                  accessor: (svc) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
                      <ServiceBadge category={svc.category_slug} serviceName={svc.name} size={28} />
                      <span>{svc.name}</span>
                    </div>
                  ),
                },
                {
                  header: 'Service Line',
                  accessor: (svc) => svc.category_slug
                    ? <ServiceCategoryLabel category={svc.category_slug} />
                    : <span style={detail.empty}>—</span>,
                },
                {
                  header: 'Price',
                  accessor: (svc) =>
                    svc.base_price_cents
                      ? `${formatCurrency(svc.base_price_cents)}${svc.billing_frequency === 'monthly' ? '/mo' : ''}`
                      : <span style={detail.empty}>—</span>,
                  style: { textAlign: 'right' },
                },
                {
                  header: '',
                  accessor: (svc) => (
                    <LinkButton variant="secondary" size="sm" href={`/admin/services/${svc.slug}`}>
                      View
                    </LinkButton>
                  ),
                  style: { textAlign: 'right' },
                },
              ]}
            />
          ) : (
            <p style={{ ...detail.value, color: color.text.muted }}>
              No services assigned to this project.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
