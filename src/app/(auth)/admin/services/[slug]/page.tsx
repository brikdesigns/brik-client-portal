import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Dot } from '@bds/components/ui/Dot/Dot';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ServiceBadge } from '@/components/service-badge';
import { ServiceTypeTag } from '@/components/status-badges';
import { ServiceDetailTabs } from '@/components/service-detail-tabs';
import { formatCurrency } from '@/lib/format';
import { gap } from '@/lib/tokens';

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

  // Fetch projects that use this service
  const { data: projectServices } = await supabase
    .from('project_services')
    .select('projects(id, name, slug, status, start_date, end_date, companies(id, name, slug))')
    .eq('service_id', service.id);

  const projects = (projectServices ?? [])
    .map((ps) => {
      const proj = (ps as unknown as { projects: {
        id: string; name: string; slug: string; status: string;
        start_date: string | null; end_date: string | null;
        companies: { id: string; name: string; slug: string } | null;
      } | null }).projects;
      return proj;
    })
    .filter(Boolean) as {
      id: string; name: string; slug: string; status: string;
      start_date: string | null; end_date: string | null;
      companies: { id: string; name: string; slug: string } | null;
    }[];

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
            label: 'Stripe',
            value: service.stripe_product_id
              ? <Badge status="positive">Linked</Badge>
              : <Badge status="neutral">Not Linked</Badge>,
          },
          {
            label: 'Status',
            value: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.xs }}>
                <Dot status={service.active ? 'positive' : 'neutral'} size="sm" />
                {service.active ? 'Active' : 'Inactive'}
              </span>
            ),
          },
          {
            label: 'Price',
            value: service.base_price_cents
              ? `${formatCurrency(service.base_price_cents)}${service.billing_frequency === 'monthly' ? '/mo' : ''}`
              : '—',
          },
        ]}
      />

      <ServiceDetailTabs
        service={{
          slug: service.slug,
          name: service.name,
          notion_page_id: (service as unknown as Record<string, string | null>).notion_page_id ?? null,
          stripe_product_id: service.stripe_product_id,
          stripe_price_id: service.stripe_price_id,
          stripe_product_url: (service as unknown as Record<string, string | null>).stripe_product_url ?? null,
          stripe_sync_status: (service as unknown as Record<string, string | null>).stripe_sync_status ?? null,
          stripe_last_synced: (service as unknown as Record<string, string | null>).stripe_last_synced ?? null,
          operational_complexity: (service as unknown as Record<string, string | null>).operational_complexity ?? null,
          offering_structure: (service as unknown as Record<string, string | null>).offering_structure ?? null,
        }}
        category={category ? { slug: category.slug } : null}
        assignments={assignments}
        projects={projects}
      />
    </div>
  );
}
