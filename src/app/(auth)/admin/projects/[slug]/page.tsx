import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { DeleteProjectButton } from '@/components/delete-project-button';
import { color, gap, space, font } from '@/lib/tokens';
import { detail } from '@/lib/styles';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
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
    .select('services(id, name, service_categories(slug))')
    .eq('project_id', project.id);

  const services = (projectServices ?? [])
    .map((ps) => {
      const svc = (ps as unknown as { services: { id: string; name: string; service_categories: { slug: string } | null } | null }).services;
      if (!svc) return null;
      return {
        id: svc.id,
        name: svc.name,
        category_slug: svc.service_categories?.slug ?? 'service',
      };
    })
    .filter(Boolean) as { id: string; name: string; category_slug: string }[];

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
      label: 'Start date',
      value: project.start_date ? new Date(project.start_date).toLocaleDateString() : '—',
    },
    {
      label: 'End date',
      value: project.end_date ? new Date(project.end_date).toLocaleDateString() : '—',
    },
  ];

  const hasClickupDetails = project.clickup_folder_id || project.clickup_list_id ||
    project.clickup_assignee || project.clickup_type || project.clickup_status;

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
            <Button variant="secondary" size="sm" asLink href={`/admin/projects/${project.slug}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={metadataItems}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        {/* Project details */}
        <h2 style={detail.sectionHeading}>Project details</h2>
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

        {/* Services */}
        {services.length > 0 && (
          <div>
            <h2 style={detail.sectionHeading}>Services</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: gap.sm, paddingTop: space.md }}>
              {services.map((svc) => (
                <div
                  key={svc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: gap.xs,
                    padding: `${gap.xs} ${gap.sm}`,
                    borderRadius: space.sm,
                    border: `1px solid ${color.border.secondary}`,
                    fontFamily: font.family.body,
                    fontSize: font.size.body.md,
                    color: color.text.primary,
                  }}
                >
                  <ServiceBadge category={svc.category_slug} size={12} />
                  {svc.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ClickUp */}
        {(project.clickup_task_id || hasClickupDetails) && (
          <div>
            <h2 style={detail.sectionHeading}>ClickUp details</h2>
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
    </div>
  );
}
