import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ClientStatusBadge, ProjectStatusBadge, InvoiceStatusBadge, ServiceStatusBadge, ServiceTypeTag } from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      id, name, slug, status, contact_name, contact_email, website_url, notes, created_at,
      projects(id, name, status, start_date, end_date),
      invoices(id, description, amount_cents, status, due_date, invoice_url),
      profiles(id, full_name, email, is_active, last_login_at),
      client_services(
        id, status, started_at, notes,
        services(id, name, slug, service_type, billing_frequency, base_price_cents,
          service_categories(slug, name)
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !client) {
    notFound();
  }

  const projects = (client.projects as { id: string; name: string; status: string; start_date: string | null; end_date: string | null }[]) ?? [];
  const invoices = (client.invoices as { id: string; description: string | null; amount_cents: number; status: string; due_date: string | null; invoice_url: string | null }[]) ?? [];
  const users = (client.profiles as { id: string; full_name: string | null; email: string; is_active: boolean; last_login_at: string | null }[]) ?? [];
  const clientServices = ((client as unknown as Record<string, unknown>).client_services as {
    id: string;
    status: string;
    started_at: string | null;
    notes: string | null;
    services: {
      id: string;
      name: string;
      slug: string;
      service_type: string;
      billing_frequency: string | null;
      base_price_cents: number | null;
      service_categories: { slug: string; name: string } | null;
    } | null;
  }[]) ?? [];

  const linkStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '13px',
    color: 'var(--_color---system--link, #0034ea)',
    textDecoration: 'none' as const,
  };

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  return (
    <div>
      <PageHeader
        title={client.name}
        badge={<ClientStatusBadge status={client.status} />}
        subtitle={
          [client.contact_name, client.contact_email].filter(Boolean).join(' · ') || undefined
        }
        action={
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href={`/admin/clients/${client.slug}/edit`} style={linkStyle}>Edit</a>
            <a href="/admin/clients" style={linkStyle}>Back to clients</a>
          </div>
        }
      />

      {/* Contact website link */}
      {client.website_url && (
        <div style={{ marginTop: '-24px', marginBottom: '24px' }}>
          <a
            href={client.website_url}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            {client.website_url}
          </a>
        </div>
      )}

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Services" value={clientServices.filter((cs) => cs.status === 'active').length} />
        <CardSummary label="Projects" value={projects.length} />
        <CardSummary label="Open invoices" value={invoices.filter((i) => i.status === 'open').length} />
        <CardSummary label="Portal users" value={users.length} />
      </div>

      {/* Services */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Services</h2>
          <a href={`/admin/clients/${client.slug}/services/new`} style={linkStyle}>Assign service</a>
        </div>
        <DataTable
          data={clientServices}
          rowKey={(cs) => cs.id}
          emptyMessage="No services assigned yet."
          columns={[
            {
              header: '',
              accessor: (cs) => {
                const slug = cs.services?.service_categories?.slug;
                return slug ? <ServiceBadge category={slug} size={16} /> : null;
              },
              style: { width: '32px', padding: '10px 4px 10px 12px' },
            },
            {
              header: 'Service',
              accessor: (cs) =>
                cs.services ? (
                  <a
                    href={`/admin/services/${cs.services.slug}`}
                    style={{ color: 'var(--_color---text--primary)', textDecoration: 'none' }}
                  >
                    {cs.services.name}
                  </a>
                ) : '—',
              style: { fontWeight: 500 },
            },
            {
              header: 'Type',
              accessor: (cs) =>
                cs.services ? <ServiceTypeTag type={cs.services.service_type} /> : '—',
            },
            {
              header: 'Price',
              accessor: (cs) =>
                cs.services?.base_price_cents
                  ? `${formatCurrency(cs.services.base_price_cents)}${cs.services.billing_frequency === 'monthly' ? '/mo' : ''}`
                  : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (cs) => <ServiceStatusBadge status={cs.status} />,
            },
          ]}
        />
      </Card>

      {/* Projects */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Projects</h2>
          <a href={`/admin/clients/${client.slug}/projects/new`} style={linkStyle}>Add project</a>
        </div>
        <DataTable
          data={projects}
          rowKey={(p) => p.id}
          emptyMessage="No projects yet."
          columns={[
            {
              header: 'Name',
              accessor: (p) => p.name,
              style: { fontWeight: 500, color: 'var(--_color---text--primary)' },
            },
            {
              header: 'Status',
              accessor: (p) => <ProjectStatusBadge status={p.status} />,
            },
            {
              header: 'Start',
              accessor: (p) => p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'End',
              accessor: (p) => p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
          ]}
        />
      </Card>

      {/* Invoices */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Invoices</h2>
          <a href={`/admin/clients/${client.slug}/invoices/new`} style={linkStyle}>Add invoice</a>
        </div>
        <DataTable
          data={invoices}
          rowKey={(inv) => inv.id}
          emptyMessage="No invoices yet."
          columns={[
            {
              header: 'Description',
              accessor: (inv) => inv.description || 'Invoice',
              style: { fontWeight: 500, color: 'var(--_color---text--primary)' },
            },
            {
              header: 'Amount',
              accessor: (inv) => formatCurrency(inv.amount_cents),
            },
            {
              header: 'Due',
              accessor: (inv) => inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
            },
            {
              header: '',
              accessor: (inv) =>
                inv.invoice_url ? (
                  <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    View
                  </a>
                ) : null,
            },
          ]}
        />
      </Card>

      {/* Portal users */}
      <Card variant="elevated" padding="lg">
        <h2 style={sectionHeadingStyle}>Portal users</h2>
        <DataTable
          data={users}
          rowKey={(u) => u.id}
          emptyMessage="No portal users assigned to this client."
          columns={[
            {
              header: 'Name',
              accessor: (u) => u.full_name || '—',
              style: { fontWeight: 500, color: 'var(--_color---text--primary)' },
            },
            {
              header: 'Email',
              accessor: (u) => u.email,
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (u) => (
                <Badge status={u.is_active ? 'positive' : 'warning'}>
                  {u.is_active ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              header: 'Last login',
              accessor: (u) => u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never',
              style: { color: 'var(--_color---text--muted)', fontSize: '13px' },
            },
          ]}
        />
      </Card>

      {/* Notes */}
      {client.notes && (
        <Card variant="outlined" padding="lg" style={{ marginTop: '24px' }}>
          <h2 style={sectionHeadingStyle}>Notes</h2>
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--secondary)',
              margin: 0,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {client.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
