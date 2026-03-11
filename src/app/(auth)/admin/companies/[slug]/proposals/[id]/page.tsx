import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProposalStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { text, heading, detail } from '@/lib/styles';
import { font, space, gap } from '@/lib/tokens';
import { ProposalActions } from '@/components/proposal-actions';
import { ProposalTabs } from '@/components/proposal-tabs';
import { ProposalSectionsView } from './sections-view';
import type {
  ProposalSectionBase,
  ScopeOfProjectSection,
  ProjectTimelineSection,
  FeeSummaryItem,
} from '@/lib/proposal-types';

function parseUserAgent(ua: string) {
  if (!ua) return { browser: '—', os: '—', device: '—' };

  // Browser
  let browser = '—';
  if (ua.includes('Edg/')) {
    const v = ua.match(/Edg\/([\d.]+)/);
    browser = `Microsoft Edge ${v?.[1] ?? ''}`.trim();
  } else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) {
    const v = ua.match(/Chrome\/([\d.]+)/);
    browser = `Google Chrome ${v?.[1] ?? ''}`.trim();
  } else if (ua.includes('Firefox/')) {
    const v = ua.match(/Firefox\/([\d.]+)/);
    browser = `Mozilla Firefox ${v?.[1] ?? ''}`.trim();
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const v = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${v?.[1] ?? ''}`.trim();
  }

  // OS
  let os = '—';
  const macMatch = ua.match(/Mac OS X ([\d_]+)/);
  const winMatch = ua.match(/Windows NT ([\d.]+)/);
  const linuxMatch = ua.includes('Linux');
  const iosMatch = ua.match(/iPhone OS ([\d_]+)/);
  const androidMatch = ua.match(/Android ([\d.]+)/);

  if (iosMatch) {
    os = `iOS ${iosMatch[1].replace(/_/g, '.')}`;
  } else if (androidMatch) {
    os = `Android ${androidMatch[1]}`;
  } else if (macMatch) {
    os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
  } else if (winMatch) {
    const winVersions: Record<string, string> = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    os = `Windows ${winVersions[winMatch[1]] ?? winMatch[1]}`;
  } else if (linuxMatch) {
    os = 'Linux';
  }

  // Device
  let device = '—';
  if (ua.includes('iPhone')) device = 'iPhone';
  else if (ua.includes('iPad')) device = 'iPad';
  else if (ua.includes('Android') && ua.includes('Mobile')) device = 'Android Phone';
  else if (ua.includes('Android')) device = 'Android Tablet';
  else if (ua.includes('Macintosh')) device = 'Mac';
  else if (ua.includes('Windows')) device = 'Windows PC';
  else if (linuxMatch) device = 'Linux PC';

  return { browser, os, device };
}

interface Props {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProposalDetailPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  // Fetch proposal with company, line items, and service categories
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      id, title, status, token, valid_until, total_amount_cents, notes,
      first_viewed_at, view_count, sent_at, accepted_at,
      accepted_by_email, accepted_by_ip, accepted_by_user_agent,
      sections, generation_status, generated_at, meeting_notes_url,
      created_at,
      companies(name, slug, contact_email),
      proposal_items(
        id, name, description, quantity, unit_price_cents, sort_order, service_id,
        services(name, service_categories(slug))
      )
    `)
    .eq('id', id)
    .single();

  if (error || !proposal) {
    notFound();
  }

  const company = proposal.companies as unknown as {
    name: string;
    slug: string;
    contact_email: string | null;
  };

  // Build enriched fee summary items with category slugs
  const rawItems = ((proposal as unknown as Record<string, unknown>).proposal_items as {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit_price_cents: number;
    sort_order: number;
    service_id: string | null;
    services: { name: string; service_categories: { slug: string } | null } | null;
  }[]) ?? [];

  const feeSummaryItems: FeeSummaryItem[] = rawItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    sort_order: item.sort_order,
    service_id: item.service_id,
    category_slug: item.services?.service_categories?.slug ?? null,
  }));

  const sections = (proposal.sections as unknown as ProposalSectionBase[]) ?? [];
  const hasSections = sections.length > 0 && sections.some(s => s.content);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com';
  const shareableLink = `${siteUrl}/proposals/${proposal.token}`;

  const isSigned = proposal.status === 'signed';
  const activeTab = isSigned && tab === 'signature' ? 'signature' : 'proposal';

  return (
    <div>
      <PageHeader
        title={proposal.title}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: company.name, href: `/admin/companies/${slug}` },
              { label: 'Proposal' },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: gap.md, alignItems: 'center' }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${slug}/proposals/${id}/edit`}>
              Edit
            </Button>
            <ProposalActions
              proposalId={proposal.id}
              status={proposal.status}
              shareableLink={shareableLink}
              clientSlug={slug}
              companyName={company.name}
            />
          </div>
        }
        metadata={[
          { label: 'Status', value: <ProposalStatusBadge status={proposal.status} /> },
          { label: 'Total', value: formatCurrency(proposal.total_amount_cents) },
          {
            label: 'Valid Until',
            value: proposal.valid_until
              ? new Date(proposal.valid_until).toLocaleDateString()
              : 'No expiration',
          },
          ...(proposal.generation_status && proposal.generation_status !== 'none'
            ? [{ label: 'Generated', value: proposal.generated_at ? new Date(proposal.generated_at).toLocaleDateString() : proposal.generation_status }]
            : []),
        ]}
      />

      {/* Tabs — only shown for signed proposals */}
      {isSigned && (
        <div style={{ marginBottom: space.lg }}>
          <ProposalTabs companySlug={slug} proposalId={id} />
        </div>
      )}

      {/* ── Proposal Tab ──────────────────────────────────────── */}
      {activeTab === 'proposal' && (
        <>
          <ProposalSectionsView
            sections={sections as (ScopeOfProjectSection | ProjectTimelineSection | ProposalSectionBase)[]}
            feeSummaryItems={feeSummaryItems}
            totalAmountCents={proposal.total_amount_cents}
            meetingNotesUrl={proposal.meeting_notes_url}
            hasSections={hasSections}
          />

          {/* Internal notes */}
          {proposal.notes && (
            <div style={{ marginTop: space.lg }}>
              <h2 style={heading.section}>Internal notes</h2>
              <p
                style={{
                  ...text.muted,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {proposal.notes}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Signature Tab ─────────────────────────────────────── */}
      {activeTab === 'signature' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          <div style={detail.grid}>
            <div>
              <p style={detail.label}>Signed by</p>
              <p style={detail.value}>{proposal.accepted_by_email || '—'}</p>
            </div>
            <div>
              <p style={detail.label}>Signed at</p>
              <p style={detail.value}>
                {proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p style={detail.label}>IP address</p>
              <p style={detail.value}>{proposal.accepted_by_ip || '—'}</p>
            </div>
          </div>

          {(() => {
            const ua = proposal.accepted_by_user_agent || '';
            const parsed = parseUserAgent(ua);
            return (
              <div style={detail.grid}>
                <div>
                  <p style={detail.label}>Browser</p>
                  <p style={detail.value}>{parsed.browser}</p>
                </div>
                <div>
                  <p style={detail.label}>Operating system</p>
                  <p style={detail.value}>{parsed.os}</p>
                </div>
                <div>
                  <p style={detail.label}>Device</p>
                  <p style={detail.value}>{parsed.device}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
