import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { AgreementStatusBadge } from '@/components/status-badges';
import { AgreementActions } from '@/components/agreement-actions';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function AgreementDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = createClient();

  const { data: agreement, error } = await supabase
    .from('agreements')
    .select(`
      id, type, title, status, token, content_snapshot, valid_until,
      signed_at, signed_by_name, signed_by_email, signed_by_ip, signed_by_user_agent,
      first_viewed_at, view_count, sent_at, created_at,
      companies(name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !agreement) {
    notFound();
  }

  const client = agreement.companies as unknown as { name: string; slug: string };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.brikdesigns.com';
  const shareableLink = `${siteUrl}/agreements/${agreement.token}`;

  const typeLabel = agreement.type === 'baa' ? 'Business Associate Agreement' : 'Marketing Agreement';

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
        title={agreement.title}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: client.name, href: `/admin/companies/${slug}` },
              { label: typeLabel },
            ]}
          />
        }
        actions={
          <AgreementActions
            agreementId={agreement.id}
            status={agreement.status}
            shareableLink={shareableLink}
            clientSlug={slug}
          />
        }
        metadata={[
          { label: 'Status', value: <AgreementStatusBadge status={agreement.status} /> },
          { label: 'Type', value: typeLabel },
          {
            label: 'Valid Until',
            value: agreement.valid_until
              ? new Date(agreement.valid_until).toLocaleDateString()
              : 'No expiration',
          },
        ]}
      />

      {/* Shareable link — visible when sent or later */}
      {(agreement.status === 'sent' || agreement.status === 'viewed' || agreement.status === 'signed') && (
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
              {agreement.view_count > 0 && (
                <Badge status="info">{agreement.view_count} view{agreement.view_count !== 1 ? 's' : ''}</Badge>
              )}
              {agreement.first_viewed_at && (
                <p style={{ ...metaValueStyle, fontSize: '13px', color: 'var(--_color---text--muted)' }}>
                  First viewed: {new Date(agreement.first_viewed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Agreement text preview */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <h2 style={sectionHeadingStyle}>Agreement Text</h2>
        <div
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'var(--_color---text--secondary)',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: 'var(--_color---surface--secondary)',
            borderRadius: 'var(--_border-radius---md)',
            border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
          }}
        >
          {agreement.content_snapshot}
        </div>
      </Card>

      {/* Signing audit trail */}
      {agreement.status === 'signed' && (
        <Card variant="outlined" padding="lg" style={{ marginBottom: '24px' }}>
          <h2 style={sectionHeadingStyle}>Signing Record</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={metaLabelStyle}>Signed By</p>
              <p style={metaValueStyle}>{agreement.signed_by_name}</p>
            </div>
            <div>
              <p style={metaLabelStyle}>Email</p>
              <p style={metaValueStyle}>{agreement.signed_by_email}</p>
            </div>
            <div>
              <p style={metaLabelStyle}>Signed At</p>
              <p style={metaValueStyle}>
                {agreement.signed_at ? new Date(agreement.signed_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p style={metaLabelStyle}>IP Address</p>
              <p style={metaValueStyle}>{agreement.signed_by_ip || '—'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={metaLabelStyle}>User Agent</p>
              <p style={{ ...metaValueStyle, fontSize: '12px', wordBreak: 'break-all' }}>
                {agreement.signed_by_user_agent || '—'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
