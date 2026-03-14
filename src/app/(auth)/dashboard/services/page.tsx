import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { ServiceCategoryLabel } from '@/components/service-badge';
import { ServiceStatusBadge } from '@/components/status-badges';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/format';
import { getCurrentClientId } from '@/lib/current-client';
import { font, color, space, gap } from '@/lib/tokens';
import { heading, text } from '@/lib/styles';

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
        <EmptyState
          title="No client selected"
          description="Use the client switcher above to select a client."
          inline={false}
        />
      </div>
    );
  }

  const { data: clientServices } = await supabase
    .from('company_services')
    .select(`
      id, status, started_at, notes,
      services(
        id, name, description, service_type, billing_frequency, base_price_cents,
        service_categories(slug, name)
      )
    `)
    .eq('company_id', currentClientId)
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
          gap: space.md,
          marginBottom: space.xl,
        }}
      >
        <CardSummary label="Total Services" value={services.length} />
        <CardSummary label="Active" value={activeCount} />
        <CardSummary
          label="Monthly Cost"
          value={monthlyCost > 0 ? formatCurrency(monthlyCost) : '$0'}
        />
      </div>

      {services.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, marginBottom: gap.xs }}>
                      {svc.service_categories && (
                        <ServiceCategoryLabel category={svc.service_categories.slug} />
                      )}
                      <ServiceStatusBadge status={cs.status} />
                    </div>
                    <h2 style={heading.card}>
                      {svc.name}
                    </h2>
                    {svc.description && (
                      <p
                        style={{
                          ...text.bodySmall,
                          margin: `${gap.xs} 0 0`,
                        }}
                      >
                        {svc.description}
                      </p>
                    )}
                    {cs.started_at && (
                      <p
                        style={{
                          ...text.bodyXs,
                          margin: `${gap.xs} 0 0`,
                        }}
                      >
                        Since {new Date(cs.started_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: space.lg }}>
                    {svc.base_price_cents && (
                      <p
                        style={{
                          ...heading.card,
                          fontSize: font.size.heading.small,
                        }}
                      >
                        {formatCurrency(svc.base_price_cents)}
                        {svc.billing_frequency === 'monthly' && (
                          <span
                            style={{
                              ...text.bodyXs,
                              fontWeight: font.weight.regular,
                            }}
                          >
                            /mo
                          </span>
                        )}
                      </p>
                    )}
                    <p
                      style={{
                        ...text.bodyXs,
                        margin: `${gap.tiny} 0 0`,
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
        <EmptyState
          title="No services yet"
          description="Contact us to get started with your first service."
          inline={false}
        />
      )}
    </div>
  );
}
