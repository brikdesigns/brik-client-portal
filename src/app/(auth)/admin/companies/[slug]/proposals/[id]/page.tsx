import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ProposalStatusBadge } from '@/components/status-badges';
import { formatCurrency } from '@/lib/format';
import { ProposalActions } from '@/components/proposal-actions';
import { ProposalSectionViewer } from '@/components/proposal-section-viewer';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ProposalDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = createClient();

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      id, title, status, token, valid_until, total_amount_cents, notes,
      first_viewed_at, view_count, sent_at, accepted_at,
      accepted_by_email, accepted_by_ip, accepted_by_user_agent,
      sections, generation_status, generated_at, meeting_notes_url,
      created_at,
      companies(name, slug, contact_email),
      proposal_items(id, name, description, quantity, unit_price_cents, sort_order)
    `)
    .eq('id', id)
    .single();

  if (error || !proposal) {
    notFound();
  }

  const client = proposal.companies as unknown as { name: string; slug: string; contact_email: string | null };
  const items = ((proposal as unknown as Record<string, unknown>).proposal_items as {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit_price_cents: number;
    sort_order: number;
  }[]) ?? [];

  const sections = (proposal.sections as unknown as { type: string; title: string; content: string | null; sort_order: number }[]) ?? [];
  const hasSections = sections.length > 0 && sections.some(s => s.content);

  const sortedItems = items.sort((a, b) => a.sort_order - b.sort_order);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com';
  const shareableLink = `${siteUrl}/proposals/${proposal.token}`;

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600 as const,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  const metaLabelStyle = {
    fontFamily: 'var(--_typography---font-family--label)',
    fontSize: '13px',
    fontWeight: 500 as const,
    color: 'var(--_color---text--muted)',
    margin: '0 0 4px',
  };

  const metaValueStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    color: 'var(--_color---text--primary)',
    margin: 0,
  };

  return (
    <div>
      <PageHeader
        title={proposal.title}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: client.name, href: `/admin/companies/${slug}` },
              { label: 'Proposal' },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: 'var(--_space---gap--md)', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${slug}/proposals/${id}/edit`}>
              Edit
            </Button>
            <ProposalActions
              proposalId={proposal.id}
              status={proposal.status}
              shareableLink={shareableLink}
              clientSlug={slug}
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

      {/* Shareable link — visible when sent or later */}
      {(proposal.status === 'sent' || proposal.status === 'viewed' || proposal.status === 'accepted') && (
        <Card variant="outlined" padding="lg" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={metaLabelStyle}>Shareable Link</p>
              <p style={{ ...metaValueStyle, wordBreak: 'break-all' }}>
                <a
                  href={shareableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--_color---system--link)', textDecoration: 'none' }}
                >
                  {shareableLink}
                </a>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {proposal.view_count > 0 && (
                <Badge status="info">{proposal.view_count} view{proposal.view_count !== 1 ? 's' : ''}</Badge>
              )}
              {proposal.first_viewed_at && (
                <p style={{ ...metaValueStyle, fontSize: '13px', color: 'var(--_color---text--muted)' }}>
                  First viewed: {new Date(proposal.first_viewed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* AI-generated sections */}
      {hasSections && (
        <div style={{ marginBottom: '24px' }}>
          {sections
            .filter(s => s.type !== 'fee_summary' && s.content)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((section) => (
              <ProposalSectionViewer
                key={section.type}
                title={section.title}
                content={section.content!}
                sectionNumber={section.sort_order}
              />
            ))}
        </div>
      )}

      {/* Line items */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <h2 style={sectionHeadingStyle}>
          {hasSections ? 'Fee Summary' : 'Line Items'}
        </h2>
        <DataTable
          data={sortedItems}
          rowKey={(item) => item.id}
          emptyMessage="No line items."
          columns={[
            {
              header: 'Item',
              accessor: (item) => (
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--_color---text--primary)', margin: 0 }}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p style={{ fontSize: '13px', color: 'var(--_color---text--muted)', margin: '4px 0 0' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              ),
            },
            {
              header: 'Qty',
              accessor: (item) => item.quantity,
              style: { width: '60px', textAlign: 'center' },
            },
            {
              header: 'Unit Price',
              accessor: (item) => formatCurrency(item.unit_price_cents),
              style: { textAlign: 'right', color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Subtotal',
              accessor: (item) => formatCurrency(item.unit_price_cents * item.quantity),
              style: { textAlign: 'right', fontWeight: 500 },
            },
          ]}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: 'var(--_typography---heading--small, 18px)',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: 0,
            }}
          >
            Total: {formatCurrency(proposal.total_amount_cents)}
          </p>
        </div>
      </Card>

      {/* Acceptance audit trail */}
      {proposal.status === 'accepted' && (
        <Card variant="outlined" padding="lg" style={{ marginBottom: '24px' }}>
          <h2 style={sectionHeadingStyle}>Acceptance Record</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={metaLabelStyle}>Accepted By</p>
              <p style={metaValueStyle}>{proposal.accepted_by_email}</p>
            </div>
            <div>
              <p style={metaLabelStyle}>Accepted At</p>
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
              <p style={{ ...metaValueStyle, fontSize: '12px', wordBreak: 'break-all' }}>
                {proposal.accepted_by_user_agent || '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Meeting notes source */}
      {proposal.meeting_notes_url && (
        <Card variant="outlined" padding="lg" style={{ marginBottom: '24px' }}>
          <h2 style={sectionHeadingStyle}>Meeting Notes Source</h2>
          <a
            href={proposal.meeting_notes_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--_color---system--link)', textDecoration: 'none', fontFamily: 'var(--_typography---font-family--body)', fontSize: '14px' }}
          >
            {proposal.meeting_notes_url}
          </a>
        </Card>
      )}

      {/* Internal notes */}
      {proposal.notes && (
        <Card variant="outlined" padding="lg">
          <h2 style={sectionHeadingStyle}>Internal Notes</h2>
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--secondary)',
              margin: 0,
              lineHeight: 1.6,
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
