import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { ServiceStatusBadge, ServiceTypeTag } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select(`
      id, name, slug, description, service_type, billing_frequency,
      base_price_cents, stripe_product_id, stripe_price_id,
      active, created_at,
      service_categories(id, name, slug, color_token),
      client_services(
        id, status, started_at, cancelled_at, notes,
        clients(id, name, slug, status)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !service) {
    notFound();
  }

  const category = service.service_categories as unknown as { id: string; name: string; slug: string; color_token: string } | null;
  const assignments = (service.client_services as unknown as {
    id: string;
    status: string;
    started_at: string | null;
    cancelled_at: string | null;
    notes: string | null;
    clients: { id: string; name: string; slug: string; status: string } | null;
  }[]) ?? [];

  const activeAssignments = assignments.filter((a) => a.status === 'active').length;

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

  const detailLabelStyle = {
    fontFamily: 'var(--_typography---font-family--label)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--_color---text--secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 4px',
  };

  const detailValueStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    color: 'var(--_color---text--primary)',
    margin: 0,
  };

  return (
    <div>
      <PageHeader
        title={service.name}
        badge={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {category && <ServiceBadge category={category.slug} size={20} />}
            <ServiceTypeTag type={service.service_type} />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: service.active
                  ? 'var(--services--green-dark)'
                  : 'var(--_color---text--muted)',
              }}
            >
              {service.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        }
        subtitle={service.description || undefined}
        action={
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href={`/admin/services/${service.slug}/edit`} style={linkStyle}>
              Edit
            </a>
            <a href="/admin/services" style={linkStyle}>
              Back to services
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Active clients" value={activeAssignments} />
        <CardSummary label="Total assigned" value={assignments.length} />
        <CardSummary
          label="Price"
          value={
            service.base_price_cents
              ? `${formatCurrency(service.base_price_cents)}${service.billing_frequency === 'monthly' ? '/mo' : ''}`
              : 'N/A'
          }
        />
      </div>

      {/* Service details */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <h2 style={sectionHeadingStyle}>Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
          <div>
            <p style={detailLabelStyle}>Category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {category && <ServiceBadge category={category.slug} size={14} />}
              <p style={detailValueStyle}>{category?.name ?? 'Uncategorized'}</p>
            </div>
          </div>
          <div>
            <p style={detailLabelStyle}>Billing</p>
            <p style={detailValueStyle}>
              {service.billing_frequency === 'monthly' ? 'Monthly' : 'One-time'}
            </p>
          </div>
          <div>
            <p style={detailLabelStyle}>Stripe product</p>
            <p style={detailValueStyle}>
              {service.stripe_product_id ? (
                <a
                  href={`https://dashboard.stripe.com/products/${service.stripe_product_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...linkStyle, fontFamily: 'monospace', fontSize: '12px' }}
                >
                  {service.stripe_product_id} &#x2197;
                </a>
              ) : '—'}
            </p>
          </div>
          <div>
            <p style={detailLabelStyle}>Stripe price</p>
            <p style={detailValueStyle}>
              {service.stripe_price_id ? (
                <a
                  href={`https://dashboard.stripe.com/prices/${service.stripe_price_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...linkStyle, fontFamily: 'monospace', fontSize: '12px' }}
                >
                  {service.stripe_price_id} &#x2197;
                </a>
              ) : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Client assignments */}
      <Card variant="elevated" padding="lg">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Client assignments</h2>
        </div>
        <DataTable
          data={assignments}
          rowKey={(a) => a.id}
          emptyMessage="No clients have been assigned this service yet."
          columns={[
            {
              header: 'Client',
              accessor: (a) =>
                a.clients ? (
                  <a
                    href={`/admin/clients/${a.clients.slug}`}
                    style={{ color: 'var(--_color---text--primary)', textDecoration: 'none' }}
                  >
                    {a.clients.name}
                  </a>
                ) : (
                  '—'
                ),
              style: { fontWeight: 500 },
            },
            {
              header: 'Status',
              accessor: (a) => <ServiceStatusBadge status={a.status} />,
            },
            {
              header: 'Started',
              accessor: (a) =>
                a.started_at ? new Date(a.started_at).toLocaleDateString() : '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Notes',
              accessor: (a) => a.notes || '—',
              style: { color: 'var(--_color---text--muted)', fontSize: '13px' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
