import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';

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
      start_date, end_date, notion_page_id, created_at,
      clients(id, name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  const client = project.clients as unknown as { id: string; name: string; slug: string } | null;

  const metadataItems = [
    {
      label: 'Client',
      value: client ? (
        <a
          href={`/admin/clients/${client.slug}`}
          style={{ color: 'var(--_color---system--link, #0034ea)', textDecoration: 'none' }}
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
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: 'var(--_typography---heading--small, 18px)',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
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
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '13px',
              color: 'var(--_color---system--link, #0034ea)',
              textDecoration: 'none',
            }}
          >
            Open in Notion &#x2197;
          </a>
        </Card>
      )}

      {/* Project details card */}
      <Card variant="elevated" padding="lg">
        <h2
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--small, 18px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 16px',
          }}
        >
          Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{
              fontFamily: 'var(--_typography---font-family--label)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--_color---text--secondary)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              margin: '0 0 4px',
            }}>Created</p>
            <p style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--primary)',
              margin: 0,
            }}>
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          {project.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{
                fontFamily: 'var(--_typography---font-family--label)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--_color---text--secondary)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                margin: '0 0 4px',
              }}>Description</p>
              <p style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                color: 'var(--_color---text--primary)',
                margin: 0,
                lineHeight: 1.5,
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
