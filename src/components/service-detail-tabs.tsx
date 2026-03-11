'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { DataTable } from '@/components/data-table';
import { ServiceBadge } from '@/components/service-badge';
import { ServiceStatusBadge } from '@/components/status-badges';
import { font, color, gap, space, border } from '@/lib/tokens';
import { detail } from '@/lib/styles';

const tabDefs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Companies', value: 'companies' },
];

const tabStyle = (active: boolean) => ({
  fontFamily: font.family.label,
  fontSize: font.size.body.md,
  fontWeight: font.weight.medium,
  color: active ? color.text.brand : color.text.muted,
  textDecoration: 'none' as const,
  padding: `${gap.sm} 0`,
  background: 'none',
  border: 'none',
  borderBottom: active
    ? `${border.width.lg} solid ${color.text.brand}`
    : `${border.width.lg} solid transparent`,
  marginBottom: `calc(-1 * ${border.width.md})`,
  cursor: 'pointer' as const,
});

const complexityLabels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const offeringLabels: Record<string, string> = { single_service: 'Standalone', bundled: 'Bundled' };

interface ServiceData {
  slug: string;
  notion_page_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  stripe_product_url: string | null;
  stripe_sync_status: string | null;
  stripe_last_synced: string | null;
  operational_complexity: string | null;
  offering_structure: string | null;
  name: string;
}

interface CategoryData {
  slug: string;
}

interface Assignment {
  id: string;
  status: string;
  started_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  companies: { id: string; name: string; slug: string; status: string } | null;
}

interface Props {
  service: ServiceData;
  category: CategoryData | null;
  assignments: Assignment[];
}

export function ServiceDetailTabs({ service, category, assignments }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab');
  const activeTab = tab === 'companies' ? 'companies' : 'overview';

  const fieldLabelStyle = detail.label;
  const fieldValueStyle = detail.value;
  const linkStyle = detail.link;

  function switchTab(value: string) {
    const url = value === 'overview'
      ? `/admin/services/${service.slug}`
      : `/admin/services/${service.slug}?tab=${value}`;
    router.push(url, { scroll: false });
  }

  return (
    <>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: gap.xl,
          borderBottom: `${border.width.md} solid ${color.border.muted}`,
          marginBottom: space.lg,
        }}
      >
        {tabDefs.map((t) => (
          <button
            key={t.value}
            style={tabStyle(activeTab === t.value)}
            onClick={() => switchTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

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
                {service.notion_page_id ? (
                  <a
                    href={`https://www.notion.so/${service.notion_page_id.replace(/-/g, '')}`}
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
                {service.stripe_product_url ? (
                  <a
                    href={service.stripe_product_url}
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
                {service.stripe_last_synced
                  ? new Date(service.stripe_last_synced).toLocaleDateString()
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
                {service.operational_complexity
                  ? complexityLabels[service.operational_complexity] ?? service.operational_complexity
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
                {service.offering_structure
                  ? offeringLabels[service.offering_structure] ?? service.offering_structure
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
    </>
  );
}
