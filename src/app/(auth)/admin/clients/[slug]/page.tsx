import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ClientStatusBadge, ProjectStatusBadge, InvoiceStatusBadge, ServiceStatusBadge, ServiceTypeTag } from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      id, name, slug, status, contact_name, contact_email, website_url, notes, created_at,
      address, phone, industry,
      projects(id, name, status, start_date, end_date),
      invoices(id, description, amount_cents, status, due_date, invoice_url),
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

  // Fetch client_users separately since it references auth.users, not profiles
  const { data: clientUsers } = await supabase
    .from('client_users')
    .select('id, user_id, role')
    .eq('client_id', client.id);

  // Fetch profiles for these users
  const userIds = clientUsers?.map(cu => cu.user_id) || [];
  const { data: userProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_active, last_login_at')
    .in('id', userIds);

  const projects = (client.projects as { id: string; name: string; status: string; start_date: string | null; end_date: string | null }[]) ?? [];
  const invoices = (client.invoices as { id: string; description: string | null; amount_cents: number; status: string; due_date: string | null; invoice_url: string | null }[]) ?? [];

  // Map client_users with profiles
  const users = (clientUsers || []).map((cu) => {
    const profile = userProfiles?.find(p => p.id === cu.user_id);
    return {
      id: profile?.id || '',
      full_name: profile?.full_name || null,
      email: profile?.email || '',
      is_active: profile?.is_active || false,
      last_login_at: profile?.last_login_at || null,
      role: cu.role,
    };
  });

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
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/admin/clients' },
              { label: client.name },
            ]}
          />
        }
        actions={
          <Button variant="primary" size="sm" asLink href={`/admin/clients/${client.slug}/edit`}>
            Edit client
          </Button>
        }
        metadata={[
          { label: 'Status', value: <ClientStatusBadge status={client.status} /> },
          { label: 'Contact', value: client.contact_name || '—' },
          { label: 'Email', value: client.contact_email || '—' },
          {
            label: 'Website',
            value: client.website_url ? (
              <a
                href={client.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--_color---system--link)', textDecoration: 'none' }}
              >
                {client.website_url}
              </a>
            ) : '—',
          },
        ]}
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Services" value={clientServices.filter((cs) => cs.status === 'active').length} />
        <CardSummary label="Projects" value={projects.length} />
        <CardSummary label="Open invoices" value={invoices.filter((i) => i.status === 'open').length} />
        <CardSummary label="Users" value={users.length} />
      </div>

      {/* Onboarding — visible for prospects */}
      {client.status === 'prospect' && (
        <div style={{ marginBottom: 'var(--_space---xxl)' }}>
          <h2 style={sectionHeadingStyle}>Onboarding</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--_space---gap--lg)',
            }}
          >
            <CardControl
              title="Marketing Analysis"
              description="Evaluate the prospect's current marketing presence, competitors, and opportunities for growth."
              action={<Button variant="primary" size="sm">Start</Button>}
            />
            <CardControl
              title="Proposal"
              description="Generate a tailored proposal based on the marketing analysis and recommended services."
              action={<Button variant="primary" size="sm">Start</Button>}
            />
            <CardControl
              title="Welcome to Brik"
              description="Send the welcome package, onboard the client, and transition from prospect to active."
              action={<Button variant="primary" size="sm">Start</Button>}
            />
          </div>
        </div>
      )}

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
                  <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </a>
                ) : null,
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>

      {/* Portal users */}
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Users</h2>
          <a href={`/admin/clients/${client.slug}/members/new`} style={linkStyle}>Add user</a>
        </div>
        <DataTable
          data={users}
          rowKey={(u) => u.id}
          emptyMessage="No members assigned to this client."
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
              header: 'Role',
              accessor: (u) => (
                <Badge status="neutral">
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </Badge>
              ),
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
