import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { ServiceCard } from '@/components/service-card';
import { ServiceCategoryLabel } from '@/components/service-badge';
import { ServiceStatusBadge } from '@/components/status-badges';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/format';
import { getCurrentClientId } from '@/lib/current-client';

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get current client from cookie
  const currentClientId = await getCurrentClientId(user!.id);

  // If no client selected, show empty state
  if (!currentClientId) {
    return (
      <div>
        <PageHeader title="Services" subtitle="Select a client to view services." />
        <Card variant="elevated" padding="lg">
          <EmptyState>No client selected. Use the client switcher above to select a client.</EmptyState>
        </Card>
      </div>
    );
  }

  const { data: clientServices } = await supabase
    .from('client_services')
    .select(`
      id, status, started_at, notes,
      services(
        id, name, description, service_type, billing_frequency, base_price_cents,
        service_categories(slug, name)
      )
    `)
    .eq('client_id', currentClientId)
    .order('created_at', { ascending: false });

  const services = clientServices ?? [];
  const activeCount = services.filter((cs) => cs.status === 'active').length;

  // Calculate monthly cost from active monthly services
  const monthlyCost = services
    .filter((cs) => cs.status === 'active')
    .reduce((sum, cs) => {
      const svc = cs.services as unknown as {
        billing_frequency: string | null;
        base_price_cents: number | null;
      } | null;
      if (svc?.billing_frequency === 'monthly' && svc.base_price_cents) {
        return sum + svc.base_price_cents;
      }
      return sum;
    }, 0);

  const subtitle = activeCount > 0
    ? `You have ${activeCount} active service${activeCount !== 1 ? 's' : ''}.`
    : 'No active services.';

  return (
    <div>
      <PageHeader title="Services" subtitle={subtitle} />

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <CardSummary label="Total services" value={services.length} />
        <CardSummary label="Active" value={activeCount} />
        <CardSummary
          label="Monthly cost"
          value={monthlyCost > 0 ? formatCurrency(monthlyCost) : '$0'}
        />
      </div>

      {services.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {services.map((cs) => {
            const svc = cs.services as unknown as {
              id: string;
              name: string;
              description: string | null;
              service_type: string;
              billing_frequency: string | null;
              base_price_cents: number | null;
              service_categories: { slug: string; name: string } | null;
            } | null;

            if (!svc) return null;

            return (
              <Card key={cs.id} variant="elevated" padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {svc.service_categories && (
                        <ServiceCategoryLabel category={svc.service_categories.slug} />
                      )}
                      <ServiceStatusBadge status={cs.status} />
                    </div>
                    <h2
                      style={{
                        fontFamily: 'var(--_typography---font-family--heading)',
                        fontSize: 'var(--_typography---heading--small, 18px)',
                        fontWeight: 600,
                        color: 'var(--_color---text--primary)',
                        margin: 0,
                      }}
                    >
                      {svc.name}
                    </h2>
                    {svc.description && (
                      <p
                        style={{
                          fontFamily: 'var(--_typography---font-family--body)',
                          fontSize: '14px',
                          color: 'var(--_color---text--secondary)',
                          margin: '8px 0 0',
                          lineHeight: 1.5,
                        }}
                      >
                        {svc.description}
                      </p>
                    )}
                    {cs.started_at && (
                      <p
                        style={{
                          fontFamily: 'var(--_typography---font-family--body)',
                          fontSize: '13px',
                          color: 'var(--_color---text--muted)',
                          margin: '8px 0 0',
                        }}
                      >
                        Since {new Date(cs.started_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
                    {svc.base_price_cents && (
                      <p
                        style={{
                          fontFamily: 'var(--_typography---font-family--heading)',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--_color---text--primary)',
                          margin: 0,
                        }}
                      >
                        {formatCurrency(svc.base_price_cents)}
                        {svc.billing_frequency === 'monthly' && (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: 'var(--_color---text--muted)',
                            }}
                          >
                            /mo
                          </span>
                        )}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: 'var(--_typography---font-family--label)',
                        fontSize: '11px',
                        color: 'var(--_color---text--muted)',
                        margin: '4px 0 0',
                        textTransform: 'capitalize',
                      }}
                    >
                      {svc.service_type.replace('_', '-')}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="elevated" padding="lg">
          <EmptyState>No services yet. Contact us to get started.</EmptyState>
        </Card>
      )}
    </div>
  );
}
