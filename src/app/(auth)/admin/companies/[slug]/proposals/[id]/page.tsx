import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { Card } from '@bds/components/ui/Card/Card';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ProposalStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { text, heading, meta } from '@/lib/styles';
import { font, space, gap } from '@/lib/tokens';
import { ProposalActions } from '@/components/proposal-actions';
import { ProposalSectionsView } from './sections-view';
import type {
  ProposalSectionBase,
  ScopeOfProjectSection,
  ProjectTimelineSection,
  FeeSummaryItem,
} from '@/lib/proposal-types';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ProposalDetailPage({ params }: Props) {
  const { slug, id } = await params;
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

  const metaLabelStyle = meta.label;
  const metaValueStyle = meta.value;
  const sectionHeadingStyle = heading.section;

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

      {/* Proposal sections — collapsible cards with structured content */}
      <ProposalSectionsView
        sections={sections as (ScopeOfProjectSection | ProjectTimelineSection | ProposalSectionBase)[]}
        feeSummaryItems={feeSummaryItems}
        totalAmountCents={proposal.total_amount_cents}
        meetingNotesUrl={proposal.meeting_notes_url}
        hasSections={hasSections}
      />

      {/* Signature audit trail */}
      {proposal.status === 'signed' && (
        <Card variant="outlined" padding="lg" style={{ marginBottom: space.lg }}>
          <h2 style={sectionHeadingStyle}>Signature Record</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
            <div>
              <p style={metaLabelStyle}>Signed By</p>
              <p style={metaValueStyle}>{proposal.accepted_by_email}</p>
            </div>
            <div>
              <p style={metaLabelStyle}>Signed At</p>
              <p style={metaValueStyle}>
                {proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p style={metaLabelStyle}>IP Address</p>
              <p style={metaValueStyle}>{proposal.accepted_by_ip || '—'}</p>
            </div>
            <div>
              <p style={metaLabelStyle}>User Agent</p>
              <p style={{ ...metaValueStyle, fontSize: font.size.body.xs, wordBreak: 'break-all' }}>
                {proposal.accepted_by_user_agent || '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Internal notes */}
      {proposal.notes && (
        <Card variant="outlined" padding="lg">
          <h2 style={sectionHeadingStyle}>Internal Notes</h2>
          <p
            style={{
              ...text.muted,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {proposal.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
