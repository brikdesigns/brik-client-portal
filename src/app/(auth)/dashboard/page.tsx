import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { ProjectStatusBadge, InvoiceStatusBadge } from '@/components/status-badges';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/format';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id, full_name')
    .eq('id', user!.id)
    .single();

  const [projectsRes, invoicesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, description, start_date, end_date')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('invoices')
      .select('id, amount_cents, currency, status, description, due_date, invoice_url')
      .order('invoice_date', { ascending: false })
      .limit(5),
  ]);

  const projects = projectsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const openInvoices = invoices.filter((i) => i.status === 'open');
  const totalDue = openInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="Here's a snapshot of your account."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard label="Active projects" value={activeProjects} />
        <StatCard label="Open invoices" value={openInvoices.length} />
        <StatCard label="Amount due" value={formatCurrency(totalDue)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent projects */}
        <Card variant="elevated" padding="lg">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: 'var(--_typography---heading--small, 18px)',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: 0,
              }}
            >
              Projects
            </h2>
            <a
              href="/dashboard/projects"
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--_color---system--link, #0034ea)',
                textDecoration: 'none',
              }}
            >
              View all
            </a>
          </div>

          {projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--_color---border--secondary, #e0e0e0)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--_color---text--primary)',
                        margin: 0,
                      }}
                    >
                      {project.name}
                    </p>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  {project.description && (
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '13px',
                        color: 'var(--_color---text--secondary)',
                        margin: '6px 0 0',
                      }}
                    >
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No projects yet.</EmptyState>
          )}
        </Card>

        {/* Recent invoices */}
        <Card variant="elevated" padding="lg">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: 'var(--_typography---heading--small, 18px)',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: 0,
              }}
            >
              Invoices
            </h2>
            <a
              href="/dashboard/billing"
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--_color---system--link, #0034ea)',
                textDecoration: 'none',
              }}
            >
              View all
            </a>
          </div>

          {invoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--_color---border--secondary, #e0e0e0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--_color---text--primary)',
                        margin: 0,
                      }}
                    >
                      {invoice.description || 'Invoice'}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '13px',
                        color: 'var(--_color---text--muted)',
                        margin: '4px 0 0',
                      }}
                    >
                      {invoice.due_date
                        ? `Due ${new Date(invoice.due_date).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--_color---text--primary)',
                        margin: 0,
                      }}
                    >
                      {formatCurrency(invoice.amount_cents)}
                    </p>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No invoices yet.</EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
}
