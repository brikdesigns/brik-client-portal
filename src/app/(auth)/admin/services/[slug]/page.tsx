import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { ServiceStatusBadge, ServiceTypeTag } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { font, color, space, gap } from '@/lib/tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select(`
      id, name, slug, description, service_type, billing_frequency,
      base_price_cents, stripe_product_id, stripe_price_id,
      active, created_at,
      service_categories(id, name, slug, color_token),
      company_services(
        id, status, started_at, cancelled_at, notes,
        companies(id, name, slug, status)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !service) {
    notFound();
  }

  const category = service.service_categories as unknown as { id: string; name: string; slug: string; color_token: string } | null;
  const assignments = (service.company_services as unknown as {
    id: string;
    status: string;
    started_at: string | null;
    cancelled_at: string | null;
    notes: string | null;
    companies: { id: string; name: string; slug: string; status: string } | null;
  }[]) ?? [];

  const activeAssignments = assignments.filter((a) => a.status === 'active').length;

  const sectionLabelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.lg,
    fontWeight: font.weight.semibold,
    color: color.text.muted,
    margin: 0,
    paddingTop: space.xl,
  };

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

  const linkStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.xs,
    color: color.system.link,
    textDecoration: 'none' as const,
  };

  return (
    <div>
      <PageHeader
        title={service.name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Services', href: '/admin/services' },
              { label: service.name },
            ]}
          />
        }
        subtitle={service.description || undefined}
        actions={
          <Button variant="primary" size="sm" asLink href={`/admin/services/${service.slug}/edit`}>
            Edit service
          </Button>
        }
        metadata={[
          {
            label: 'Category',
            value: category ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.sm }}>
                <ServiceBadge category={category.slug} size={14} />
                {category.name}
              </span>
            ) : 'Uncategorized',
          },
          { label: 'Type', value: <ServiceTypeTag type={service.service_type} /> },
          { label: 'Status', value: service.active ? 'Active' : 'Inactive' },
          {
            label: 'Price',
            value: service.base_price_cents
              ? `${formatCurrency(service.base_price_cents)}${service.billing_frequency === 'monthly' ? '/mo' : ''}`
              : '—',
          },
        ]}
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: space.md,
          marginBottom: space.lg,
        }}
      >
        <CardSummary label="Active clients" value={activeAssignments} />
        <CardSummary label="Total assigned" value={assignments.length} />
      </div>

      {/* Stripe integration */}
      {(service.stripe_product_id || service.stripe_price_id) && (
        <>
          <p style={sectionLabelStyle}>Stripe</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
            <div>
              <p style={fieldLabelStyle}>Product</p>
              <p style={fieldValueStyle}>
                {service.stripe_product_id ? (
                  <a
                    href={`https://dashboard.stripe.com/products/${service.stripe_product_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...linkStyle, fontFamily: 'monospace', fontSize: font.size.body.xs }}
                  >
                    {service.stripe_product_id} &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Price</p>
              <p style={fieldValueStyle}>
                {service.stripe_price_id ? (
                  <a
                    href={`https://dashboard.stripe.com/prices/${service.stripe_price_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...linkStyle, fontFamily: 'monospace', fontSize: font.size.body.xs }}
                  >
                    {service.stripe_price_id} &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
            <div />
          </div>
        </>
      )}

      {/* Client assignments */}
      <p style={sectionLabelStyle}>Client assignments</p>
      <DataTable
        data={assignments}
        rowKey={(a) => a.id}
        emptyMessage="No clients have been assigned this service yet."
        columns={[
          {
            header: 'Client',
            accessor: (a) =>
              a.companies ? (
                <a
                  href={`/admin/companies/${a.companies.slug}`}
                  style={{ color: color.text.primary, textDecoration: 'none' }}
                >
                  {a.companies.name}
                </a>
              ) : (
                '—'
              ),
            style: { fontWeight: font.weight.medium },
          },
          {
            header: 'Status',
            accessor: (a) => <ServiceStatusBadge status={a.status} />,
          },
          {
            header: 'Started',
            accessor: (a) =>
              a.started_at ? new Date(a.started_at).toLocaleDateString() : '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'Notes',
            accessor: (a) => a.notes || '—',
            style: { color: color.text.muted },
          },
        ]}
      />
    </div>
  );
}
