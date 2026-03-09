import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { font, color, gap, space } from '@/lib/tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

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

  const fieldLabelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.sm,
    fontWeight: font.weight.medium,
    color: color.text.muted,
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.primary,
    margin: 0,
  };

  const sectionLabelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.lg,
    fontWeight: font.weight.medium,
    color: color.text.muted,
    margin: 0,
    paddingTop: space.xl,
  };

  const metadataItems = [
    {
      label: 'Client',
      value: client ? (
        <a
          href={`/admin/companies/${client.slug}`}
          style={{ color: color.system.link, textDecoration: 'none' }}
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
          <Button variant="secondary" size="sm" asLink href={`/admin/projects/${project.slug}/edit`}>
            Edit
          </Button>
        }
        metadata={metadataItems}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Status</p>
            <p style={fieldValueStyle}><ProjectStatusBadge status={project.status} /></p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Created</p>
            <p style={fieldValueStyle}>
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Notion</p>
            <p style={fieldValueStyle}>
              {project.notion_page_id ? (
                <a
                  href={`https://notion.so/${project.notion_page_id.replace(/-/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: color.system.link, textDecoration: 'none' }}
                >
                  Open in Notion &#x2197;
                </a>
              ) : (
                <span style={{ color: color.text.muted }}>—</span>
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div>
            <p style={fieldLabelStyle}>Description</p>
            <p style={{
              ...fieldValueStyle,
              lineHeight: font.lineHeight.normal,
            }}>
              {project.description}
            </p>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div>
            <p style={sectionLabelStyle}>Services</p>
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
                    fontSize: font.size.body.sm,
                    color: color.text.primary,
                  }}
                >
                  <ServiceBadge category={svc.category_slug} serviceName={svc.name} size={20} />
                  {svc.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ClickUp */}
        {(project.clickup_task_id || hasClickupDetails) && (
          <div>
            <p style={sectionLabelStyle}>ClickUp</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, paddingTop: space.md }}>
              <div>
                <p style={fieldLabelStyle}>Task</p>
                <p style={fieldValueStyle}>
                  {project.clickup_task_id ? (
                    <a
                      href={`https://app.clickup.com/t/${project.clickup_task_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: color.system.link, textDecoration: 'none' }}
                    >
                      {project.clickup_task_id} &#x2197;
                    </a>
                  ) : (
                    <span style={{ color: color.text.muted }}>—</span>
                  )}
                </p>
              </div>
              <div>
                <p style={fieldLabelStyle}>Folder</p>
                <p style={fieldValueStyle}>{project.clickup_folder_id || <span style={{ color: color.text.muted }}>—</span>}</p>
              </div>
              <div>
                <p style={fieldLabelStyle}>List</p>
                <p style={fieldValueStyle}>{project.clickup_list_id || <span style={{ color: color.text.muted }}>—</span>}</p>
              </div>
              <div>
                <p style={fieldLabelStyle}>Assignee</p>
                <p style={fieldValueStyle}>{project.clickup_assignee || <span style={{ color: color.text.muted }}>—</span>}</p>
              </div>
              <div>
                <p style={fieldLabelStyle}>Type</p>
                <p style={fieldValueStyle}>{project.clickup_type || <span style={{ color: color.text.muted }}>—</span>}</p>
              </div>
              <div>
                <p style={fieldLabelStyle}>Status</p>
                <p style={fieldValueStyle}>{project.clickup_status || <span style={{ color: color.text.muted }}>—</span>}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
