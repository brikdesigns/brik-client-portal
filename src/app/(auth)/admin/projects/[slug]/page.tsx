import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { font, color, space } from '@/lib/tokens';

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

      {/* Notion link */}
      {project.notion_page_id && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: space.lg }}>
          <h2
            style={{
              fontFamily: font.family.heading,
              fontSize: font.size.heading.small,
              fontWeight: font.weight.semibold,
              color: color.text.primary,
              margin: '0 0 12px',
            }}
          >
            Notion
          </h2>
          <a
            href={`https://notion.so/${project.notion_page_id.replace(/-/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.xs,
              color: color.system.link,
              textDecoration: 'none',
            }}
          >
            Open in Notion &#x2197;
          </a>
        </Card>
      )}

      {/* ClickUp link */}
      {project.clickup_task_id && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: space.lg }}>
          <h2
            style={{
              fontFamily: font.family.heading,
              fontSize: font.size.heading.small,
              fontWeight: font.weight.semibold,
              color: color.text.primary,
              margin: '0 0 12px',
            }}
          >
            ClickUp
          </h2>
          <a
            href={`https://app.clickup.com/t/${project.clickup_task_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.xs,
              color: color.system.link,
              textDecoration: 'none',
            }}
          >
            Open in ClickUp &#x2197;
          </a>
        </Card>
      )}

      {/* Project details card */}
      <Card variant="elevated" padding="lg">
        <h2
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.small,
            fontWeight: font.weight.semibold,
            color: color.text.primary,
            margin: '0 0 16px',
          }}
        >
          Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
          <div>
            <p style={{
              fontFamily: font.family.label,
              fontSize: font.size.body.xs,
              fontWeight: font.weight.semibold,
              color: color.text.secondary,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              margin: '0 0 4px',
            }}>Created</p>
            <p style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              color: color.text.primary,
              margin: 0,
            }}>
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          {project.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{
                fontFamily: font.family.label,
                fontSize: font.size.body.xs,
                fontWeight: font.weight.semibold,
                color: color.text.secondary,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                margin: '0 0 4px',
              }}>Description</p>
              <p style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.sm,
                color: color.text.primary,
                margin: 0,
                lineHeight: font.lineHeight.normal,
              }}>
                {project.description}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
