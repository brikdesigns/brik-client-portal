import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { PageHeader } from '@/components/page-header';
import { ProjectStatusBadge } from '@/components/status-badges';
import { EmptyState } from '@/components/empty-state';
import { font, color, gap, space } from '@/lib/tokens';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, description, start_date, end_date')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Projects" subtitle="All your projects with Brik Designs." />

      {projects && projects.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
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
                      fontFamily: font.family.heading,
                      fontSize: font.size.heading.small,
                      fontWeight: font.weight.semibold,
                      color: color.text.primary,
                      margin: 0,
                    }}
                  >
                    {project.name}
                  </h2>
                  {project.description && (
                    <p
                      style={{
                        fontFamily: font.family.body,
                        fontSize: font.size.body.sm,
                        color: color.text.secondary,
                        margin: `${gap.xs} 0 0`,
                        lineHeight: font.lineHeight.normal,
                      }}
                    >
                      {project.description}
                    </p>
                  )}
                  {(project.start_date || project.end_date) && (
                    <p
                      style={{
                        fontFamily: font.family.body,
                        fontSize: font.size.body.xs,
                        color: color.text.muted,
                        margin: `${gap.xs} 0 0`,
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
        <EmptyState
          title="No projects yet"
          description="Your projects with Brik Designs will appear here."
          inline={false}
        />
      )}
    </div>
  );
}
