import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatIndustry, formatPhone, formatContactRole } from '@/lib/format';
import { parseAddressString, extractStreet } from '@/lib/address';

import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Button } from '@bds/components/ui/Button/Button';
import { Dot } from '@bds/components/ui/Dot/Dot';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import {
  CompanyStatusBadge,
  CompanyTypeTag,
  InvoiceStatusBadge,
  ServiceStatusBadge,
  ServiceTypeTag,
  ProposalStatusBadge,
  AgreementStatusBadge,
} from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { DeleteCompanyButton } from '@/components/delete-company-button';
import { QualifyLeadButton } from '@/components/qualify-lead-button';
import { GenerateProposalButton } from '@/components/generate-proposal-button';
import { RunAnalysisButton } from '@/components/run-analysis-button';
import { GHLSyncButton } from '@/components/ghl-sync-button';
import { ResendWelcomeButton } from '@/components/resend-welcome-button';
import { RemoveServiceButton } from '@/components/remove-service-button';
import { ReportStatusBadge, ScoreTierBadge } from '@/components/report-badges';
import { REPORT_TYPE_LABELS, type ReportType } from '@/lib/analysis/report-config';
import { formatCurrency } from '@/lib/format';
import { font, color, gap, space, border, shadow } from '@/lib/tokens';
import { heading, detail } from '@/lib/styles';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CompanyDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('companies')
    .select(`
      id, name, slug, type, status, contact_name, contact_email, website_url, notes, created_at,
      address, phone, industry,
      city, state, postal_code, country,
      domain_hosted, referred_by, other_marketing_company,
      pipeline, pipeline_stage, opportunity_owner, followers, introduction_date, ghl_contact_id,
      ghl_tags, ghl_source, ghl_opportunity_value_cents, ghl_last_synced,
      projects(id, name, slug, status, start_date, end_date),
      invoices(id, description, amount_cents, status, due_date, invoice_url),
      company_services(
        id, status, started_at, notes,
        services(id, name, slug, service_type, billing_frequency, base_price_cents,
          offering_structure, included_scope,
          service_categories(slug, name)
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch all secondary data in parallel (contacts, proposals, reportSet, agreements, prospective services)
  const [
    { data: contacts },
    { data: proposals },
    { data: reportSet },
    { data: agreements },
    { data: prospectiveItems },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, full_name, email, phone, title, role, is_primary, user_id, setup_completed_at')
      .eq('company_id', client.id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('proposals')
      .select('id, title, status, total_amount_cents, created_at')
      .eq('company_id', client.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('report_sets')
      .select('id, type, status, overall_tier')
      .eq('company_id', client.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('agreements')
      .select('id, type, title, status, created_at')
      .eq('company_id', client.id)
      .order('created_at', { ascending: false }),
    // Services from the most recent active (unsigned) proposal — shown as "Pending" on services tab
    // Only show items from the latest active proposal to avoid stale drafts polluting the list
    (async () => {
      const { data: latestActiveProposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('company_id', client.id)
        .in('status', ['draft', 'sent', 'viewed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestActiveProposal) return { data: null };

      return supabase
        .from('proposal_items')
        .select(`
          id, service_id,
          services(id, name, slug, service_type, billing_frequency, base_price_cents,
            service_categories(slug, name)
          ),
          proposals!inner(id, title, status, company_id)
        `)
        .eq('proposal_id', latestActiveProposal.id)
        .not('service_id', 'is', null);
    })(),
  ]);

  const latestProposal = proposals?.[0] || null;

  // Reports depend on reportSet — sequential
  const { data: reports } = reportSet
    ? await supabase
        .from('reports')
        .select('id, report_type, status, score, max_score, tier, created_at, updated_at')
        .eq('report_set_id', reportSet.id)
        .order('created_at', { ascending: true })
    : { data: null };

  const allReports = reports ?? [];

  const latestBaa = agreements?.find((a) => a.type === 'baa') || null;

  const projects = (client.projects as { id: string; name: string; slug: string; status: string; start_date: string | null; end_date: string | null }[]) ?? [];
  const invoices = (client.invoices as { id: string; description: string | null; amount_cents: number; status: string; due_date: string | null; invoice_url: string | null }[]) ?? [];

  const clientServices = ((client as unknown as Record<string, unknown>).company_services as {
    id: string;
    status: string;
    started_at: string | null;
    notes: string | null;
    services: {
      id: string;
      name: string;
      slug: string;
      service_type: string;
      billing_frequency: string | null;
      base_price_cents: number | null;
      offering_structure: string | null;
      included_scope: string | null;
      service_categories: { slug: string; name: string } | null;
    } | null;
  }[]) ?? [];

  // Merge prospective services (from unsigned proposals) into the services list.
  // Deduplicate: if a service already exists in company_services, skip the proposal version.
  const assignedServiceIds = new Set(clientServices.map((cs) => cs.services?.id).filter(Boolean));

  const prospectiveServices = (prospectiveItems ?? [])
    .filter((pi) => {
      const svc = (pi as unknown as Record<string, unknown>).services as { id: string } | null;
      return svc && !assignedServiceIds.has(svc.id);
    })
    .reduce((acc, pi) => {
      // Deduplicate by service_id across multiple proposal items
      const svc = (pi as unknown as Record<string, unknown>).services as {
        id: string; name: string; slug: string; service_type: string;
        billing_frequency: string | null; base_price_cents: number | null;
        offering_structure: string | null; included_scope: string | null;
        service_categories: { slug: string; name: string } | null;
      };
      const proposal = (pi as unknown as Record<string, unknown>).proposals as { title: string; status: string };
      const serviceStatus = proposal.status === 'draft' ? 'not_started' : 'pending';
      if (!acc.has(svc.id)) {
        acc.set(svc.id, {
          id: `proposal-${pi.id}`,
          status: serviceStatus,
          started_at: null,
          notes: `From proposal: ${proposal.title}`,
          services: svc,
          _fromProposal: true,
          _proposalStatus: proposal.status,
        });
      }
      return acc;
    }, new Map<string, typeof clientServices[number] & { _fromProposal?: boolean; _proposalStatus?: string }>());

  const allServices = [...clientServices, ...prospectiveServices.values()];

  const companyType = (client as unknown as { type: string }).type;

  const rawCity = (client as unknown as Record<string, string>).city;
  const rawState = (client as unknown as Record<string, string>).state;
  const rawPostalCode = (client as unknown as Record<string, string>).postal_code;
  const rawCountry = (client as unknown as Record<string, string>).country;
  // Fallback: parse structured fields from address string for legacy data
  const parsed = (!rawCity && client.address) ? parseAddressString(client.address) : null;
  const displayCity = rawCity || parsed?.city || '—';
  const displayState = rawState || parsed?.state || '—';
  const displayPostalCode = rawPostalCode || parsed?.postalCode || '—';
  const displayCountry = rawCountry || '—';

  // Tab configuration by type
  const allTabs: { key: string; label: string; types: string[]; dot?: boolean }[] = [
    { key: 'overview', label: 'Overview', types: ['lead', 'prospect', 'client'] },
    { key: 'reporting', label: 'Reporting', types: ['lead', 'prospect', 'client'], dot: !reportSet },
    { key: 'billing', label: 'Billing', types: ['prospect', 'client'], dot: !latestProposal || invoices.some((i) => i.status === 'open') },
    { key: 'services', label: 'Services', types: ['prospect', 'client'], dot: allServices.some((cs) => cs.status === 'pending') },
    { key: 'contacts', label: 'Contacts', types: ['lead', 'prospect', 'client'], dot: !contacts?.length },
  ];
  const tabs = allTabs.filter((t) => t.types.includes(companyType));
  const activeTab = tab && tabs.some((t) => t.key === tab) ? tab : 'overview';

  const tabStyle = (active: boolean) => ({
    fontFamily: font.family.label,
    fontSize: font.size.body.md,
    fontWeight: font.weight.medium,
    color: active ? color.text.brand : color.text.muted,
    textDecoration: 'none' as const,
    padding: `${gap.sm} 0`,
    borderBottom: active ? `2px solid ${color.text.brand}` : '2px solid transparent',
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
  });

  const sectionHeadingStyle = heading.section;

  const fieldLabelStyle = detail.label;
  const fieldValueStyle = detail.value;

  return (
    <div>
      <PageHeader
        title={client.name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: client.name },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: gap.md, alignItems: 'center' }}>
            <DeleteCompanyButton companyId={client.id} companyName={client.name} />
            <GHLSyncButton companyId={client.id} hasGhlId={!!(client as unknown as Record<string, string>).ghl_contact_id} />
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/edit`}>
              Edit
            </Button>
            {companyType === 'lead' && <QualifyLeadButton companyId={client.id} />}
            {companyType === 'prospect' && (!latestProposal || ['draft', 'declined', 'expired'].includes(latestProposal.status)) && (
              <GenerateProposalButton
                companyId={client.id}
                companyName={client.name}
                slug={client.slug}
                label={latestProposal ? 'New Proposal' : 'Begin Proposal'}
              />
            )}
          </div>
        }
        metadata={[
          { label: 'Status', value: <CompanyStatusBadge status={client.status} /> },
          { label: 'Type', value: <CompanyTypeTag type={companyType} muted={client.status === 'not_active'} /> },
          ...(client.industry ? [{ label: 'Industry', value: formatIndustry(client.industry) }] : []),
        ]}
      />

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: gap.xl,
          borderBottom: `${border.width.lg} solid ${color.border.muted}`,
          marginBottom: space.lg,
        }}
      >
        {tabs.map((t) => (
          <a key={t.key} href={`/admin/companies/${client.slug}?tab=${t.key}`} style={tabStyle(activeTab === t.key)}>
            {t.label}
            {t.dot && <Dot status="default" size="sm" />}
          </a>
        ))}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          {/* Stat cards */}
          {(companyType === 'client' || allServices.length > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: gap.lg,
              }}
            >
              <CardSummary
                label="Services"
                value={allServices.length}
                textLink={allServices.some((cs) => cs.status === 'pending')
                  ? { label: `${allServices.filter((cs) => cs.status === 'pending').length} pending`, href: `/admin/companies/${client.slug}?tab=services` }
                  : undefined}
              />
              <CardSummary label="Projects" value={projects.length} />
              <CardSummary
                label="Open Invoices"
                value={invoices.filter((i) => i.status === 'open').length}
              />
              <CardSummary label="Contacts" value={contacts?.length ?? 0} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={detail.sectionHeading}>Location</h2>
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/edit`}>
              Edit
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Business Name</p>
              <p style={fieldValueStyle}>{client.name || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>City</p>
              <p style={fieldValueStyle}>{displayCity}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Country</p>
              <p style={fieldValueStyle}>{displayCountry}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Address</p>
              <p style={fieldValueStyle}>{client.address ? extractStreet(client.address) : '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>State</p>
              <p style={fieldValueStyle}>{displayState}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Postal Code</p>
              <p style={fieldValueStyle}>{displayPostalCode}</p>
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={detail.sectionHeading}>Contact</h2>
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/edit`}>
              Edit
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Website</p>
              <p style={fieldValueStyle}>
                {client.website_url ? (
                  <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={detail.link}>
                    {client.website_url}
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Phone</p>
              <p style={fieldValueStyle}>{client.phone ? formatPhone(client.phone) : '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Domain Hosted</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).domain_hosted || '—'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Referred By</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).referred_by || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Other Marketing Company</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).other_marketing_company || '—'}</p>
            </div>
            <div />
          </div>

          {/* Opportunities */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={detail.sectionHeading}>Opportunities</h2>
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/opportunities/edit`}>
              Edit
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Pipeline</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).pipeline || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Stage</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).pipeline_stage || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Owner</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).opportunity_owner || '—'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
            <div>
              <p style={fieldLabelStyle}>Followers</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).followers || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Introduction Date</p>
              <p style={fieldValueStyle}>
                {(client as unknown as Record<string, string>).introduction_date
                  ? new Date((client as unknown as Record<string, string>).introduction_date).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>GoHighLevel</p>
              <p style={fieldValueStyle}>
                {(client as unknown as Record<string, string>).ghl_contact_id ? (
                  <a
                    href={`https://app.gohighlevel.com/v2/location/IZPqVFfrhjIQrXkmHChN/contacts/detail/${(client as unknown as Record<string, string>).ghl_contact_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={detail.link}
                  >
                    View in GoHighLevel &#x2197;
                  </a>
                ) : '—'}
              </p>
            </div>
          </div>

          {/* GoHighLevel */}
          {(client as unknown as Record<string, string>).ghl_contact_id && (
            <>
              <h2 style={detail.sectionHeading}>GoHighLevel</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
                <div>
                  <p style={fieldLabelStyle}>Source</p>
                  <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).ghl_source || '—'}</p>
                </div>
                <div>
                  <p style={fieldLabelStyle}>Opportunity Value</p>
                  <p style={fieldValueStyle}>
                    {(client as unknown as Record<string, number>).ghl_opportunity_value_cents
                      ? formatCurrency((client as unknown as Record<string, number>).ghl_opportunity_value_cents)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p style={fieldLabelStyle}>Last Synced</p>
                  <p style={fieldValueStyle}>
                    {(client as unknown as Record<string, string>).ghl_last_synced
                      ? new Date((client as unknown as Record<string, string>).ghl_last_synced).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl, textAlign: 'left' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={fieldLabelStyle}>Tags</p>
                  <div style={{ display: 'flex', gap: gap.sm, flexWrap: 'wrap', marginTop: gap.xs }}>
                    {(client as unknown as Record<string, string[]>).ghl_tags?.length
                      ? (client as unknown as Record<string, string[]>).ghl_tags.map((tag) => (
                          <Tag key={tag} size="sm">{tag}</Tag>
                        ))
                      : <p style={fieldValueStyle}>—</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {client.notes && (
            <>
              <h2 style={detail.sectionHeading}>Notes</h2>
              <p
                style={{
                  ...fieldValueStyle,
                  lineHeight: font.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {client.notes}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Reporting Tab ──────────────────────────────────────── */}
      {activeTab === 'reporting' && (
        <>
          {!reportSet ? (
            <CardControl
              title="Marketing Analysis"
              description="Evaluate the company's current marketing presence, competitors, and opportunities for growth."
              action={<RunAnalysisButton clientId={client.id} slug={client.slug} />}
              style={{ boxShadow: shadow.sm }}
            />
          ) : (
            <DataTable
              data={allReports}
              rowKey={(r) => r.id}
              emptyMessage="No reports generated yet"
              emptyDescription="Run a marketing analysis to generate reports for this company."
              columns={[
                {
                  header: 'Report',
                  accessor: (r) => (
                    <a
                      href={`/admin/companies/${client.slug}/reporting/${r.report_type}`}
                      style={{ color: color.text.primary, textDecoration: 'none', fontWeight: font.weight.medium }}
                    >
                      {REPORT_TYPE_LABELS[r.report_type as ReportType] || r.report_type}
                    </a>
                  ),
                },
                {
                  header: 'Type',
                  accessor: () => reportSet?.type === 'marketing_analysis' ? 'Marketing Analysis' : (reportSet?.type ?? '—'),
                  style: { color: color.text.secondary },
                },
                {
                  header: 'Score',
                  accessor: (r) => r.tier ? <ScoreTierBadge tier={r.tier} /> : <ReportStatusBadge status={r.status} />,
                },
                {
                  header: 'Last Updated',
                  accessor: (r) => r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—',
                  style: { color: color.text.secondary },
                },
                {
                  header: '',
                  accessor: (r) => (
                    <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/reporting/${r.report_type}`}>
                      View
                    </Button>
                  ),
                  style: { textAlign: 'right' },
                },
              ]}
            />
          )}
        </>
      )}

      {/* ── Billing Tab (prospects + clients) ────────────────────── */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          {/* Prospect view — CardControl cards */}
          {companyType === 'prospect' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
              <CardControl
                title="Proposal"
                description={
                  latestProposal
                    ? `${latestProposal.title} — ${formatCurrency(latestProposal.total_amount_cents)}`
                    : 'Auto-generates from Notion meeting notes — AI recommends services and writes all sections.'
                }
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
                    {latestProposal && <ProposalStatusBadge status={latestProposal.status} />}
                    {latestProposal && (
                      <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/proposals/${latestProposal.id}`}>
                        View
                      </Button>
                    )}
                    {(!latestProposal || ['declined', 'expired'].includes(latestProposal.status)) && (
                      <GenerateProposalButton companyId={client.id} companyName={client.name} slug={client.slug} />
                    )}
                  </div>
                }
                style={{ boxShadow: shadow.sm }}
              />
              {latestBaa && (
                <CardControl
                  title="Business Associate Agreement"
                  description={`BAA — ${latestBaa.status === 'signed' ? 'Signed' : latestBaa.status === 'sent' || latestBaa.status === 'viewed' ? 'Awaiting signature' : 'Draft'}`}
                  action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
                      <AgreementStatusBadge status={latestBaa.status} />
                      <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${latestBaa.id}`}>
                        View
                      </Button>
                    </div>
                  }
                  style={{ boxShadow: shadow.sm }}
                />
              )}
            </div>
          )}

          {/* Client view — unified billing table */}
          {companyType === 'client' && (() => {
            const billingRows: { id: string; name: string; type: string; status: React.ReactNode; href: string }[] = [];

            // Add proposals
            if (proposals?.length) {
              for (const p of proposals) {
                billingRows.push({
                  id: `proposal-${p.id}`,
                  name: p.title || 'Proposal',
                  type: 'Proposal',
                  status: <ProposalStatusBadge status={p.status} />,
                  href: `/admin/companies/${client.slug}/proposals/${p.id}`,
                });
              }
            }

            // Add agreements
            if (agreements?.length) {
              for (const a of agreements.filter((ag) => ag.type === 'baa')) {
                billingRows.push({
                  id: `agreement-${a.id}`,
                  name: a.title || 'Business Associate Agreement',
                  type: 'Agreement',
                  status: <AgreementStatusBadge status={a.status} />,
                  href: `/admin/companies/${client.slug}/agreements/${a.id}`,
                });
              }
            }

            // Add invoices
            for (const inv of invoices) {
              billingRows.push({
                id: `invoice-${inv.id}`,
                name: inv.description || 'Invoice',
                type: 'Invoice',
                status: <InvoiceStatusBadge status={inv.status} />,
                href: `/admin/invoices/${inv.id}/edit`,
              });
            }

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
                  <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Billing</h2>
                  <Button variant="primary" size="sm" asLink href={`/admin/companies/${client.slug}/invoices/new`}>Add Invoice</Button>
                </div>
                <DataTable
                  data={billingRows}
                  rowKey={(r) => r.id}
                  emptyMessage="No billing records yet"
                  emptyDescription="Add an invoice or create a proposal to start tracking billing."
                  emptyAction={{ label: 'Add Invoice', href: `/admin/companies/${client.slug}/invoices/new` }}
                  columns={[
                    {
                      header: 'Name',
                      accessor: (r) => r.name,
                      style: { fontWeight: font.weight.medium, color: color.text.primary },
                    },
                    {
                      header: 'Type',
                      accessor: (r) => (
                        <Tag size="sm" style={{ color: color.text.muted }}>{r.type}</Tag>
                      ),
                    },
                    {
                      header: 'Status',
                      accessor: (r) => r.status,
                    },
                    {
                      header: '',
                      accessor: (r) => (
                        <Button variant="secondary" size="sm" asLink href={r.href}>
                          View
                        </Button>
                      ),
                      style: { textAlign: 'right' },
                    },
                  ]}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Services Tab ───────────────────────────────────────── */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Services</h2>
            <Button variant="primary" size="sm" asLink href={`/admin/companies/${client.slug}/services/new`}>Assign Service</Button>
          </div>
          <DataTable
            data={allServices}
            rowKey={(cs) => cs.id}
            emptyMessage="No services assigned yet"
            emptyDescription="Assign a service from the catalog to this company."
            emptyAction={{ label: 'Assign Service', href: `/admin/companies/${client.slug}/services/new` }}
            columns={[
              {
                header: '',
                accessor: (cs) => {
                  const catSlug = cs.services?.service_categories?.slug;
                  return catSlug ? <ServiceBadge category={catSlug} serviceName={cs.services?.name} size={28} /> : null;
                },
                style: { width: '32px', padding: `${space.xs} ${gap.xs} ${space.xs} ${space.sm}` },
              },
              {
                header: 'Service',
                accessor: (cs) => {
                  if (!cs.services) return '—';
                  const isProspective = (cs as unknown as Record<string, unknown>)._fromProposal;
                  const href = isProspective
                    ? `/admin/services/${cs.services.slug}`
                    : `/admin/companies/${client.slug}/services/${cs.services.slug}`;
                  return (
                    <a href={href} style={{ color: color.text.primary, textDecoration: 'none' }}>
                      {cs.services.name}
                    </a>
                  );
                },
                style: { fontWeight: font.weight.medium },
              },
              {
                header: 'Type',
                accessor: (cs) =>
                  cs.services ? <ServiceTypeTag type={cs.services.service_type} /> : '—',
              },
              {
                header: 'Price',
                accessor: (cs) =>
                  cs.services?.base_price_cents
                    ? `${formatCurrency(cs.services.base_price_cents)}${cs.services.billing_frequency === 'monthly' ? '/mo' : ''}`
                    : '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'Status',
                accessor: (cs) => <ServiceStatusBadge status={cs.status} />,
              },
              {
                header: 'Started',
                accessor: (cs) =>
                  cs.started_at ? new Date(cs.started_at).toLocaleDateString() : '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'Notes',
                accessor: (cs) => cs.notes || '—',
                style: { color: color.text.muted },
              },
              {
                header: '',
                accessor: (cs) => {
                  if (!cs.services) return null;
                  const isProspective = (cs as unknown as Record<string, unknown>)._fromProposal;
                  const isProspectCompany = companyType === 'lead' || companyType === 'prospect';
                  const href = isProspective
                    ? `/admin/services/${cs.services.slug}`
                    : `/admin/companies/${client.slug}/services/${cs.services.slug}`;
                  return (
                    <span style={{ display: 'inline-flex', gap: gap.xs, justifyContent: 'flex-end' }}>
                      {isProspectCompany && (() => {
                        // Only allow removal when proposal is still in draft (editable)
                        const proposalStatus = isProspective
                          ? (cs as unknown as Record<string, unknown>)._proposalStatus as string
                          : latestProposal?.status;
                        const canRemove = !proposalStatus || proposalStatus === 'draft';
                        return canRemove ? (
                          <RemoveServiceButton
                            assignmentId={isProspective ? undefined : cs.id}
                            proposalItemId={isProspective ? cs.id.replace('proposal-', '') : undefined}
                            serviceName={cs.services.name}
                            companySlug={client.slug}
                            companyType={companyType}
                          />
                        ) : null;
                      })()}
                      <Button variant="secondary" size="sm" asLink href={href}>
                        View
                      </Button>
                    </span>
                  );
                },
                style: { textAlign: 'right' as const },
              },
            ]}
          />

        </div>
      )}

      {/* ── Projects Tab ──────────────────────────────────────── */}
      {/* ── Contacts Tab ──────────────────────────────────────── */}
      {activeTab === 'contacts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Contacts</h2>
            <Button variant="primary" size="sm" asLink href={`/admin/contacts/new?company_id=${client.id}`}>
              Add New
            </Button>
          </div>
          <DataTable
            data={contacts ?? []}
            rowKey={(c) => c.id}
            emptyMessage="No contacts yet"
            emptyDescription="Add a contact to keep track of people at this company."
            emptyAction={{ label: 'Add Contact', href: `/admin/contacts/new?company_id=${client.id}` }}
            columns={[
              {
                header: 'Name',
                accessor: (c) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.md, fontWeight: font.weight.medium, color: color.text.primary }}>
                    {c.full_name}
                    {c.is_primary && (
                      <Tag size="sm" style={{ color: color.text.muted }}>Primary</Tag>
                    )}
                  </span>
                ),
              },
              {
                header: 'Job Title',
                accessor: (c) => c.title || '—',
                style: { color: color.text.secondary, minWidth: '120px' },
              },
              {
                header: 'Email',
                accessor: (c) => c.email || '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'Phone',
                accessor: (c) => c.phone ? formatPhone(c.phone) : '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'Role',
                accessor: (c) => (
                  <Tag size="sm" style={{ color: color.text.muted }}>
                    {formatContactRole(c.role)}
                  </Tag>
                ),
              },
              {
                header: '',
                accessor: (c) => (
                  <span style={{ display: 'inline-flex', gap: gap.xs, justifyContent: 'flex-end' }}>
                    {c.email && !c.setup_completed_at && (
                      <ResendWelcomeButton contactId={c.id} contactName={c.full_name ?? c.email} />
                    )}
                    <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${c.id}`}>
                      View
                    </Button>
                  </span>
                ),
                style: { textAlign: 'right' },
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
