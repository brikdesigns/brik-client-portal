import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { ServiceStatusBadge, ServiceTypeTag } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { ServiceTabs } from '@/components/service-tabs';
import { font, color, space, gap } from '@/lib/tokens';
import { detail } from '@/lib/styles';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select(`
      id, name, slug, description, service_type, billing_frequency,
      base_price_cents, stripe_product_id, stripe_price_id,
      stripe_product_url, stripe_sync_status, stripe_last_synced,
      operational_complexity, offering_structure, notion_page_id,
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

  const tabKeys = ['overview', 'companies'];
  const activeTab = tab && tabKeys.includes(tab) ? tab : 'overview';

  const fieldLabelStyle = detail.label;
  const fieldValueStyle = detail.value;
  const linkStyle = detail.link;

  const complexityLabels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
  const offeringLabels: Record<string, string> = { single_service: 'Standalone', bundled: 'Bundled' };

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
          <Button variant="secondary" size="sm" asLink href={`/admin/services/${service.slug}/edit`}>
            Edit
          </Button>
        }
        metadata={[
          {
            label: 'Service Line',
            value: category ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.sm }}>
                <ServiceBadge category={category.slug} serviceName={service.name} size={28} />
                {category.name}
              </span>
            ) : 'Uncategorized',
          },
          { label: 'Type', value: <ServiceTypeTag type={service.service_type} /> },
          {
            label: 'Status',
            value: service.active
              ? <Badge status="positive">Active</Badge>
              : <Badge status="neutral">Inactive</Badge>,
          },
          {
            label: 'Price',
            value: service.base_price_cents
              ? `${formatCurrency(service.base_price_cents)}${service.billing_frequency === 'monthly' ? '/mo' : ''}`
              : '—',
          },
        ]}
        tabs={<ServiceTabs slug={service.slug} />}
      />

      {/* ── Overview Tab ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          {/* Details */}
          <h2 style={detail.sectionHeading}>Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Icon</p>
              <div style={fieldValueStyle}>
                <ServiceBadge category={category?.slug ?? 'service'} serviceName={service.name} size={40} />
              </div>
            </div>
            <div>
              <p style={fieldLabelStyle}>Notion</p>
              <p style={fieldValueStyle}>
                {(service as unknown as Record<string, string>).notion_page_id ? (
                  <a
                    href={`https://www.notion.so/${(service as unknown as Record<string, string>).notion_page_id.replace(/-/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    View in Notion &#x2197;
                  </a>
                ) : (
                  <span style={detail.empty}>—</span>
                )}
              </p>
            </div>
            <div />
          </div>

          {/* Stripe */}
          <h2 style={detail.sectionHeading}>Stripe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Stripe Product</p>
              <p style={fieldValueStyle}>
                {service.stripe_product_id ? (
                  <a
                    href={`https://dashboard.stripe.com/products/${service.stripe_product_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...linkStyle, fontFamily: 'monospace' }}
                  >
                    {service.stripe_product_id} &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Stripe Price</p>
              <p style={fieldValueStyle}>
                {service.stripe_price_id ? (
                  <a
                    href={`https://dashboard.stripe.com/prices/${service.stripe_price_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...linkStyle, fontFamily: 'monospace' }}
                  >
                    {service.stripe_price_id} &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Stripe Product URL</p>
              <p style={fieldValueStyle}>
                {(service as unknown as Record<string, string>).stripe_product_url ? (
                  <a
                    href={(service as unknown as Record<string, string>).stripe_product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    View in Stripe &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Stripe Last Sync</p>
              <p style={fieldValueStyle}>
                {(service as unknown as Record<string, string>).stripe_last_synced
                  ? new Date((service as unknown as Record<string, string>).stripe_last_synced).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div />
            <div />
          </div>

          {/* Operations */}
          <h2 style={detail.sectionHeading}>Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Operations Cost</p>
              <p style={fieldValueStyle}>
                {(service as unknown as Record<string, string>).operational_complexity
                  ? complexityLabels[(service as unknown as Record<string, string>).operational_complexity] ?? (service as unknown as Record<string, string>).operational_complexity
                  : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Automation</p>
              <p style={fieldValueStyle}>—</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Offering Structure</p>
              <p style={fieldValueStyle}>
                {(service as unknown as Record<string, string>).offering_structure
                  ? offeringLabels[(service as unknown as Record<string, string>).offering_structure] ?? (service as unknown as Record<string, string>).offering_structure
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Companies Tab ──────────────────────────────────────── */}
      {activeTab === 'companies' && (
        <DataTable
          data={assignments}
          rowKey={(a) => a.id}
          emptyMessage="No clients assigned yet"
          emptyDescription="Assign this service to a company from their detail page."
          emptyAction={{ label: 'View Companies', href: '/admin/companies' }}
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
            {
              header: '',
              accessor: (a) =>
                a.companies ? (
                  <Button variant="secondary" size="sm" asLink href={`/admin/companies/${a.companies.slug}`}>
                    View
                  </Button>
                ) : null,
              style: { textAlign: 'right' as const },
            },
          ]}
        />
      )}
    </div>
  );
}
