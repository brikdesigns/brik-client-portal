import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ServiceBadge, categoryConfig } from '@/components/service-badge';
import { ServiceTypeTag, ClientStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';

export default async function AdminServicesPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from('services')
    .select(`
      id,
      name,
      slug,
      description,
      service_type,
      billing_frequency,
      base_price_cents,
      active,
      category_id,
      stripe_product_id,
      service_categories(id, name, slug, color_token),
      client_services(id)
    `)
    .order('sort_order')
    .order('name');

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, slug, color_token, sort_order')
    .order('sort_order');

  // Group services by category
  const grouped = (categories ?? []).map((cat) => ({
    ...cat,
    services: (services ?? []).filter((s) => s.category_id === cat.id),
  }));

  // Uncategorized services
  const uncategorized = (services ?? []).filter((s) => !s.category_id);

  const totalActive = (services ?? []).filter((s) => s.active).length;
  const totalServices = (services ?? []).length;

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${totalActive} active of ${totalServices} total services in the catalog.`}
        action={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href="/admin/services/stripe-sync"
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--_color---system--link, #0034ea)',
                textDecoration: 'none',
              }}
            >
              Stripe sync
            </a>
            <Button variant="primary" size="md" asLink href="/admin/services/new">
              Add service
            </Button>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {grouped.map((cat) => (
          <CardSummary
            key={cat.id}
            label={cat.name}
            value={cat.services.filter((s) => s.active).length}
          />
        ))}
      </div>

      {grouped.map((cat) => (
        <div key={cat.id} style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <ServiceBadge category={cat.slug} size={20} />
            <h2
              style={{
                fontFamily: 'var(--_typography---font-family--heading)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--_color---text--primary)',
                margin: 0,
              }}
            >
              {cat.name}
            </h2>
            <span
              style={{
                fontFamily: 'var(--_typography---font-family--label)',
                fontSize: '12px',
                color: 'var(--_color---text--muted)',
              }}
            >
              {cat.services.length}
            </span>
          </div>
          <Card variant="elevated" padding="lg">
            <DataTable
              data={cat.services}
              rowKey={(s) => s.id}
              emptyMessage="No services in this category."
              columns={[
                {
                  header: '',
                  accessor: (s) => {
                    const cat = s.service_categories as unknown as { slug: string } | null;
                    return cat ? <ServiceBadge category={cat.slug} size={16} /> : null;
                  },
                  style: { width: '32px', padding: '10px 4px 10px 12px' },
                },
                {
                  header: 'Service',
                  accessor: (s) => s.name,
                  style: { fontWeight: 500 },
                },
                {
                  header: 'Type',
                  accessor: (s) => <ServiceTypeTag type={s.service_type} />,
                },
                {
                  header: 'Price',
                  accessor: (s) =>
                    s.base_price_cents
                      ? `${formatCurrency(s.base_price_cents)}${s.billing_frequency === 'monthly' ? '/mo' : ''}`
                      : '—',
                  style: { color: 'var(--_color---text--secondary)' },
                },
                {
                  header: 'Clients',
                  accessor: (s) =>
                    Array.isArray(s.client_services) ? s.client_services.length : 0,
                  style: { color: 'var(--_color---text--secondary)' },
                },
                {
                  header: 'Status',
                  accessor: (s) => <ClientStatusBadge status={s.active ? 'active' : 'inactive'} />,
                },
                {
                  header: 'Stripe',
                  accessor: (s) => (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: s.stripe_product_id
                          ? 'var(--services--green-dark, #4caf50)'
                          : 'var(--_color---border--secondary, #e0e0e0)',
                      }}
                      title={s.stripe_product_id ? 'Linked to Stripe' : 'Not linked'}
                    />
                  ),
                },
                {
                  header: '',
                  accessor: (s) => (
                    <Button variant="secondary" size="sm" asLink href={`/admin/services/${s.slug}`}>
                      View Details
                    </Button>
                  ),
                  style: { textAlign: 'right' },
                },
              ]}
            />
          </Card>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: '0 0 12px',
            }}
          >
            Uncategorized
          </h2>
          <Card variant="elevated" padding="lg">
            <DataTable
              data={uncategorized}
              rowKey={(s) => s.id}
              emptyMessage=""
              columns={[
                {
                  header: 'Service',
                  accessor: (s) => s.name,
                  style: { fontWeight: 500 },
                },
                {
                  header: 'Type',
                  accessor: (s) => <ServiceTypeTag type={s.service_type} />,
                },
                {
                  header: 'Price',
                  accessor: (s) =>
                    s.base_price_cents
                      ? `${formatCurrency(s.base_price_cents)}${s.billing_frequency === 'monthly' ? '/mo' : ''}`
                      : '—',
                  style: { color: 'var(--_color---text--secondary)' },
                },
                {
                  header: 'Status',
                  accessor: (s) => <ClientStatusBadge status={s.active ? 'active' : 'inactive'} />,
                },
                {
                  header: 'Stripe',
                  accessor: (s) => (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: s.stripe_product_id
                          ? 'var(--services--green-dark, #4caf50)'
                          : 'var(--_color---border--secondary, #e0e0e0)',
                      }}
                      title={s.stripe_product_id ? 'Linked to Stripe' : 'Not linked'}
                    />
                  ),
                },
                {
                  header: '',
                  accessor: (s) => (
                    <Button variant="secondary" size="sm" asLink href={`/admin/services/${s.slug}`}>
                      View Details
                    </Button>
                  ),
                  style: { textAlign: 'right' },
                },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
