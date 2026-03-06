import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { font, color, gap } from '@/lib/tokens';

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
      start_date, end_date, notion_page_id, clickup_task_id, created_at,
      companies(id, name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const client = project.companies as unknown as { id: string; name: string; slug: string } | null;

  const fieldLabelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.sm,
    fontWeight: font.weight.semibold,
    color: color.text.muted,
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.primary,
    margin: 0,
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
      label: 'Status',
      value: <ProjectStatusBadge status={project.status} />,
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
          <Button variant="primary" size="sm" asLink href={`/admin/projects/${project.slug}/edit`}>
            Edit project
          </Button>
        }
        metadata={metadataItems}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Created</p>
            <p style={fieldValueStyle}>
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          {project.notion_page_id && (
            <div>
              <p style={fieldLabelStyle}>Notion</p>
              <p style={fieldValueStyle}>
                <a
                  href={`https://notion.so/${project.notion_page_id.replace(/-/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: color.system.link, textDecoration: 'none' }}
                >
                  Open in Notion &#x2197;
                </a>
              </p>
            </div>
          )}
          {project.clickup_task_id && (
            <div>
              <p style={fieldLabelStyle}>ClickUp</p>
              <p style={fieldValueStyle}>
                <a
                  href={`https://app.clickup.com/t/${project.clickup_task_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: color.system.link, textDecoration: 'none' }}
                >
                  Open in ClickUp &#x2197;
                </a>
              </p>
            </div>
          )}
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
      </div>
    </div>
  );
}
