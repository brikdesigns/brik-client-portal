import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { ServicesFilterTable } from '@/components/services-filter-table';

export default async function AdminServicesPage() {
  const supabase = createClient();

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
      company_services(id, companies(id, name))
    `)
    .order('sort_order')
    .order('name');

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, slug, color_token, sort_order')
    .order('sort_order');

  // Transform services for the client component
  const serviceRows = (services ?? []).map((s) => {
    const cat = s.service_categories as unknown as {
      id: string;
      name: string;
      slug: string;
      color_token: string;
    } | null;
    const clientServices = s.company_services as unknown as {
      id: string;
      companies: { id: string; name: string } | null;
    }[];
    const clients = (clientServices ?? [])
      .map((cs) => cs.companies)
      .filter((c): c is { id: string; name: string } => c !== null);

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      service_type: s.service_type,
      billing_frequency: s.billing_frequency,
      base_price_cents: s.base_price_cents,
      active: s.active,
      stripe_product_id: s.stripe_product_id,
      category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
      clients,
      client_count: clients.length,
    };
  });

  // Build filter options
  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  // Get unique clients across all services
  const clientMap = new Map<string, string>();
  serviceRows.forEach((s) => {
    s.clients.forEach((c) => clientMap.set(c.id, c.name));
  });
  const clientOptions = Array.from(clientMap.entries())
    .map(([id, name]) => ({ label: name, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const totalActive = serviceRows.filter((s) => s.active).length;
  const totalServices = serviceRows.length;

  // Category stats for summary cards
  const grouped = (categories ?? []).map((cat) => ({
    ...cat,
    activeCount: serviceRows.filter((s) => s.category?.id === cat.id && s.active).length,
  }));

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${totalActive} active of ${totalServices} total services in the catalog.`}
        actions={
          <>
            <Button variant="secondary" size="md" asLink href="/admin/services/stripe-sync">
              Stripe sync
            </Button>
            <Button variant="primary" size="md" asLink href="/admin/services/new">
              Add service
            </Button>
          </>
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
            value={cat.activeCount}
          />
        ))}
      </div>

      <ServicesFilterTable
        services={serviceRows}
        categoryOptions={categoryOptions}
        clientOptions={clientOptions}
      />
    </div>
  );
}
