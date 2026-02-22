import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { PageHeader } from '@/components/page-header';
import { ServiceCard } from '@/components/service-card';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/format';
import { getCurrentClientId } from '@/lib/current-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  // Get current client from cookie
  const currentClientId = await getCurrentClientId(user!.id);

  // If no client selected, show empty state
  if (!currentClientId) {
    return (
      <div>
        <PageHeader
          title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
          subtitle="Select a client to view your dashboard."
        />
        <EmptyState>No client selected. Use the client switcher above to select a client.</EmptyState>
      </div>
    );
  }

  const [servicesRes, invoicesRes] = await Promise.all([
    supabase
      .from('company_services')
      .select(`
        id, status,
        services(
          id, name, description, service_type, billing_frequency, base_price_cents,
          service_categories(slug, name)
        )
      `)
      .eq('company_id', currentClientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, amount_cents, status')
      .eq('company_id', currentClientId)
      .order('invoice_date', { ascending: false }),
  ]);

  const clientServices = servicesRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  const activeServiceCount = clientServices.length;
  const openInvoices = invoices.filter((i) => i.status === 'open');
  const totalDue = openInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ''}`}
        subtitle="Here's a snapshot of your account."
      />

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <CardSummary label="Amount due" value={formatCurrency(totalDue)} />
        <CardSummary label="Open invoices" value={openInvoices.length} />
        <CardSummary label="Active services" value={activeServiceCount} />
      </div>

      {/* Services */}
      <h2
        style={{
          fontFamily: 'var(--_typography---font-family--heading)',
          fontSize: 'var(--_typography---heading--small, 18px)',
          fontWeight: 600,
          color: 'var(--_color---text--primary)',
          margin: '0 0 16px',
        }}
      >
        Services
      </h2>
      {clientServices.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {clientServices.map((cs) => {
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
              <ServiceCard
                key={cs.id}
                name={svc.name}
                description={svc.description}
                categorySlug={svc.service_categories?.slug ?? 'service'}
                serviceType={svc.service_type}
                href={`/dashboard/services`}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState>No active services. Contact us to get started.</EmptyState>
      )}
    </div>
  );
}
