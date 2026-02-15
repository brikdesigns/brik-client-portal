import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ServiceBadge, categoryConfig } from '@/components/service-badge';
import { ServiceTypeTag } from '@/components/status-badges';
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
          <a href="/admin/services/new">
            <Button variant="primary" size="md">
              Add service
            </Button>
          </a>
        }
      />

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
                  header: 'Service',
                  accessor: (s) => (
                    <a
                      href={`/admin/services/${s.slug}`}
                      style={{ color: 'var(--_color---text--primary)', textDecoration: 'none' }}
                    >
                      {s.name}
                    </a>
                  ),
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
                  accessor: (s) => (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: s.active
                          ? 'var(--services--green-dark)'
                          : 'var(--_color---text--muted)',
                      }}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  ),
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
                  accessor: (s) => (
                    <a
                      href={`/admin/services/${s.slug}`}
                      style={{ color: 'var(--_color---text--primary)', textDecoration: 'none' }}
                    >
                      {s.name}
                    </a>
                  ),
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
                  accessor: (s) => (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: s.active
                          ? 'var(--services--green-dark)'
                          : 'var(--_color---text--muted)',
                      }}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
