import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { PageHeader } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { EmptyState } from '@/components/empty-state';

export default async function ProjectsPage() {
  const supabase = createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, description, start_date, end_date')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Projects" subtitle="All your projects with Brik Designs." />

      {projects && projects.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map((project) => (
            <Card key={project.id} variant="elevated" padding="lg">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--_typography---font-family--heading)',
                      fontSize: 'var(--_typography---heading--small, 18px)',
                      fontWeight: 600,
                      color: 'var(--_color---text--primary)',
                      margin: 0,
                    }}
                  >
                    {project.name}
                  </h2>
                  {project.description && (
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '14px',
                        color: 'var(--_color---text--secondary)',
                        margin: '8px 0 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {project.description}
                    </p>
                  )}
                  {(project.start_date || project.end_date) && (
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '13px',
                        color: 'var(--_color---text--muted)',
                        margin: '8px 0 0',
                      }}
                    >
                      {project.start_date &&
                        new Date(project.start_date).toLocaleDateString()}
                      {project.start_date && project.end_date && ' — '}
                      {project.end_date &&
                        new Date(project.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="elevated" padding="lg">
          <EmptyState>No projects yet.</EmptyState>
        </Card>
      )}
    </div>
  );
}
