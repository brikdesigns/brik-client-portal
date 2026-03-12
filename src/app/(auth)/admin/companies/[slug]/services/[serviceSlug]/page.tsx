import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import {
  ServiceStatusBadge,
  ServiceTypeTag,
  ProjectStatusBadge,
} from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';
import { font, color, gap, space } from '@/lib/tokens';
import { detail, heading } from '@/lib/styles';

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
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (companyError || !company) notFound();

  // Fetch the company_service assignment by joining through the service slug
  const { data: assignments } = await supabase
    .from('company_services')
    .select(`
      id, status, started_at, notes, proposal_id,
      services(id, name, slug, service_type, billing_frequency, base_price_cents, description,
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
    service_categories: { slug: string; name: string } | null;
  };

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

  const categorySlug = service.service_categories?.slug ?? 'service';
  const activeTab = tab === 'projects' ? 'projects' : 'overview';

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
          <Button
            variant="primary"
            size="sm"
            asLink
            href={`/admin/companies/${company.slug}/projects/new?company_service_id=${assignment.id}`}
          >
            Add Project
          </Button>
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
        <a href={`${basePath}?tab=projects`} style={tabStyle(activeTab === 'projects')}>
          Projects
          {allProjects.length > 0 && (
            <span style={{
              fontFamily: font.family.label,
              fontSize: font.size.body.xs,
              color: activeTab === 'projects' ? color.text.brand : color.text.muted,
            }}>
              {allProjects.length}
            </span>
          )}
        </a>
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
    </div>
  );
}
