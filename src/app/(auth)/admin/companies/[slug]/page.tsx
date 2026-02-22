import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { CardControl } from '@bds/components/ui/CardControl/CardControl';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import {
  CompanyStatusBadge,
  CompanyTypeTag,
  ProjectStatusBadge,
  InvoiceStatusBadge,
  ServiceStatusBadge,
  ServiceTypeTag,
  ProposalStatusBadge,
  AgreementStatusBadge,
} from '@/components/status-badges';
import { ServiceBadge } from '@/components/service-badge';
import { DeleteCompanyButton } from '@/components/delete-company-button';
import { QualifyLeadButton } from '@/components/qualify-lead-button';
import { RunAnalysisButton } from '@/components/run-analysis-button';
import { ReportSetStatusBadge } from '@/components/report-badges';
import { formatCurrency } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CompanyDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const supabase = createClient();

  const { data: client, error } = await supabase
    .from('companies')
    .select(`
      id, name, slug, type, status, contact_name, contact_email, website_url, notes, created_at,
      address, phone, industry,
      city, state, postal_code, country,
      domain_hosted, referred_by, other_marketing_company,
      pipeline, pipeline_stage, opportunity_owner, followers, introduction_date, ghl_contact_id,
      projects(id, name, status, start_date, end_date),
      invoices(id, description, amount_cents, status, due_date, invoice_url),
      company_services(
        id, status, started_at, notes,
        services(id, name, slug, service_type, billing_frequency, base_price_cents,
          service_categories(slug, name)
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch contacts for this company
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, full_name, email, phone, title, role, is_primary, user_id')
    .eq('company_id', client.id)
    .order('is_primary', { ascending: false });

  // Fetch proposals for this client
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, title, status, total_amount_cents, created_at')
    .eq('company_id', client.id)
    .order('created_at', { ascending: false });

  const latestProposal = proposals?.[0] || null;

  // Fetch report set for marketing analysis card
  const { data: reportSet } = await supabase
    .from('report_sets')
    .select('id, status, overall_tier')
    .eq('company_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch agreements for this client (onboarding cards)
  const { data: agreements } = await supabase
    .from('agreements')
    .select('id, type, title, status, created_at')
    .eq('company_id', client.id)
    .order('created_at', { ascending: false });

  const latestAgreement = agreements?.find((a) => a.type === 'marketing_agreement') || null;
  const latestBaa = agreements?.find((a) => a.type === 'baa') || null;

  const projects = (client.projects as { id: string; name: string; status: string; start_date: string | null; end_date: string | null }[]) ?? [];
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
      service_categories: { slug: string; name: string } | null;
    } | null;
  }[]) ?? [];

  const companyType = (client as unknown as { type: string }).type;

  // Tab configuration by type
  const allTabs: { key: string; label: string; types: string[] }[] = [
    { key: 'overview', label: 'Overview', types: ['lead', 'prospect', 'client'] },
    { key: 'onboarding', label: 'Onboarding', types: ['prospect'] },
    { key: 'services', label: 'Services', types: ['client'] },
    { key: 'projects', label: 'Projects', types: ['client'] },
    { key: 'invoices', label: 'Invoices', types: ['client'] },
    { key: 'contacts', label: 'Contacts', types: ['lead', 'prospect', 'client'] },
  ];
  const tabs = allTabs.filter((t) => t.types.includes(companyType));
  const activeTab = tab && tabs.some((t) => t.key === tab) ? tab : 'overview';

  const tabStyle = (active: boolean) => ({
    fontFamily: 'var(--_typography---font-family--label, var(--_typography---font-family--body))',
    fontSize: '16px',
    fontWeight: 600,
    color: active ? 'var(--brand--primary, #E35335)' : 'var(--_color---text--secondary)',
    textDecoration: 'none' as const,
    padding: '8px 0',
    borderBottom: active ? '2px solid var(--brand--primary, #E35335)' : '2px solid transparent',
    display: 'inline-block',
  });

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  const sectionLabelStyle = {
    fontFamily: 'var(--_typography---font-family--label, var(--_typography---font-family--body))',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--_color---text--accent, #adaaa0)',
    margin: 0,
    paddingTop: '32px',
  };

  const fieldLabelStyle = {
    fontFamily: 'var(--_typography---font-family--label, var(--_typography---font-family--body))',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--_color---text--secondary)',
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    color: 'var(--_color---text--primary)',
    margin: 0,
  };

  const linkStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '13px',
    color: 'var(--_color---system--link, #0034ea)',
    textDecoration: 'none' as const,
  };

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
          <div style={{ display: 'flex', gap: 'var(--_space---gap--md)' }}>
            <DeleteCompanyButton companyId={client.id} companyName={client.name} />
            {companyType === 'lead' && <QualifyLeadButton companyId={client.id} />}
            <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={[
          { label: 'Status', value: <CompanyStatusBadge status={client.status} /> },
          { label: 'Type', value: <CompanyTypeTag type={companyType} muted={client.status === 'not_active'} /> },
          ...(client.industry ? [{ label: 'Industry', value: client.industry }] : []),
        ]}
      />

      {/* Stat cards — for clients */}
      {companyType === 'client' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <CardSummary label="Services" value={clientServices.filter((cs) => cs.status === 'active').length} />
          <CardSummary label="Projects" value={projects.length} />
          <CardSummary label="Open invoices" value={invoices.filter((i) => i.status === 'open').length} />
          <CardSummary label="Contacts" value={contacts?.length ?? 0} />
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid var(--_color---border--default, #e5e5e5)',
          marginBottom: '24px',
        }}
      >
        {tabs.map((t) => (
          <a key={t.key} href={`/admin/companies/${client.slug}?tab=${t.key}`} style={tabStyle(activeTab === t.key)}>
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={sectionHeadingStyle}>Overview</h2>

          {/* Location */}
          <p style={sectionLabelStyle}>Location</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <p style={fieldLabelStyle}>Business Name</p>
              <p style={fieldValueStyle}>{client.name || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>City</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).city || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Country</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).country || '—'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <p style={fieldLabelStyle}>Address</p>
              <p style={fieldValueStyle}>{client.address || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>State</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).state || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Postal Code</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).postal_code || '—'}</p>
            </div>
          </div>

          {/* Contact */}
          <p style={sectionLabelStyle}>Contact</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <p style={fieldLabelStyle}>Website</p>
              <p style={fieldValueStyle}>
                {client.website_url ? (
                  <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--_color---system--link)', textDecoration: 'none' }}>
                    {client.website_url}
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Phone</p>
              <p style={fieldValueStyle}>{client.phone || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Domain Hosted</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).domain_hosted || '—'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
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
          <p style={sectionLabelStyle}>Opportunities</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
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
              <p style={fieldLabelStyle}>GoHighLevel ID</p>
              <p style={fieldValueStyle}>{(client as unknown as Record<string, string>).ghl_contact_id || '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <>
              <p style={sectionLabelStyle}>Notes</p>
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
                {client.notes}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Onboarding Tab (prospects only) ────────────────────── */}
      {activeTab === 'onboarding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--_space---gap--lg)' }}>
          <CardControl
            title="Marketing Analysis"
            description={
              reportSet
                ? `Analysis ${reportSet.status === 'completed' ? 'complete' : reportSet.status === 'needs_review' ? 'needs review' : 'in progress'}.`
                : 'Evaluate the prospect\'s current marketing presence, competitors, and opportunities for growth.'
            }
            badge={reportSet ? <ReportSetStatusBadge status={reportSet.status} /> : undefined}
            action={
              reportSet ? (
                <Button variant="secondary" size="sm" asLink href={`/admin/reporting/${client.slug}`}>
                  View Details
                </Button>
              ) : (
                <RunAnalysisButton clientId={client.id} slug={client.slug} />
              )
            }
          />
          <CardControl
            title="Proposal"
            description={
              latestProposal
                ? `${latestProposal.title} — ${formatCurrency(latestProposal.total_amount_cents)}`
                : 'Generate a tailored proposal based on the marketing analysis and recommended services.'
            }
            badge={latestProposal ? <ProposalStatusBadge status={latestProposal.status} /> : undefined}
            action={
              latestProposal ? (
                <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/proposals/${latestProposal.id}`}>
                  View
                </Button>
              ) : (
                <Button variant="primary" size="sm" asLink href={`/admin/companies/${client.slug}/proposals/new`}>
                  Start
                </Button>
              )
            }
          />
          {latestProposal?.status === 'accepted' && (
            <CardControl
              title="Marketing Agreement"
              description={
                latestAgreement
                  ? `${latestAgreement.title} — ${latestAgreement.status === 'signed' ? 'Signed' : latestAgreement.status === 'sent' || latestAgreement.status === 'viewed' ? 'Awaiting signature' : 'Draft'}`
                  : 'Agreement will be generated when the proposal is accepted.'
              }
              badge={latestAgreement ? <AgreementStatusBadge status={latestAgreement.status} /> : undefined}
              action={
                latestAgreement ? (
                  <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${latestAgreement.id}`}>
                    View
                  </Button>
                ) : undefined
              }
            />
          )}
          {latestBaa && (
            <CardControl
              title="Business Associate Agreement"
              description={`BAA — ${latestBaa.status === 'signed' ? 'Signed' : latestBaa.status === 'sent' || latestBaa.status === 'viewed' ? 'Awaiting signature' : 'Draft'}`}
              badge={<AgreementStatusBadge status={latestBaa.status} />}
              action={
                <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${latestBaa.id}`}>
                  View
                </Button>
              }
            />
          )}
          <CardControl
            title="Welcome to Brik"
            description="Send the welcome package, onboard the client, and transition from prospect to active."
            action={<Button variant="primary" size="sm">Start</Button>}
          />
        </div>
      )}

      {/* ── Services Tab ───────────────────────────────────────── */}
      {activeTab === 'services' && (
        <Card variant="elevated" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Services</h2>
            <a href={`/admin/companies/${client.slug}/services/new`} style={linkStyle}>Assign service</a>
          </div>
          <DataTable
            data={clientServices}
            rowKey={(cs) => cs.id}
            emptyMessage="No services assigned yet."
            columns={[
              {
                header: '',
                accessor: (cs) => {
                  const catSlug = cs.services?.service_categories?.slug;
                  return catSlug ? <ServiceBadge category={catSlug} size={16} /> : null;
                },
                style: { width: '32px', padding: '10px 4px 10px 12px' },
              },
              {
                header: 'Service',
                accessor: (cs) =>
                  cs.services ? (
                    <a
                      href={`/admin/services/${cs.services.slug}`}
                      style={{ color: 'var(--_color---text--primary)', textDecoration: 'none' }}
                    >
                      {cs.services.name}
                    </a>
                  ) : '—',
                style: { fontWeight: 500 },
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
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Status',
                accessor: (cs) => <ServiceStatusBadge status={cs.status} />,
              },
            ]}
          />
        </Card>
      )}

      {/* ── Projects Tab ──────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <Card variant="elevated" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Projects</h2>
            <a href={`/admin/companies/${client.slug}/projects/new`} style={linkStyle}>Add project</a>
          </div>
          <DataTable
            data={projects}
            rowKey={(p) => p.id}
            emptyMessage="No projects yet."
            columns={[
              {
                header: 'Name',
                accessor: (p) => p.name,
                style: { fontWeight: 500, color: 'var(--_color---text--primary)' },
              },
              {
                header: 'Status',
                accessor: (p) => <ProjectStatusBadge status={p.status} />,
              },
              {
                header: 'Start',
                accessor: (p) => p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'End',
                accessor: (p) => p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
            ]}
          />
        </Card>
      )}

      {/* ── Invoices Tab ──────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <Card variant="elevated" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Invoices</h2>
            <a href={`/admin/companies/${client.slug}/invoices/new`} style={linkStyle}>Add invoice</a>
          </div>
          <DataTable
            data={invoices}
            rowKey={(inv) => inv.id}
            emptyMessage="No invoices yet."
            columns={[
              {
                header: 'Description',
                accessor: (inv) => inv.description || 'Invoice',
                style: { fontWeight: 500, color: 'var(--_color---text--primary)' },
              },
              {
                header: 'Amount',
                accessor: (inv) => formatCurrency(inv.amount_cents),
              },
              {
                header: 'Due',
                accessor: (inv) => inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Status',
                accessor: (inv) => <InvoiceStatusBadge status={inv.status} />,
              },
              {
                header: '',
                accessor: (inv) =>
                  inv.invoice_url ? (
                    <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </a>
                  ) : null,
                style: { textAlign: 'right' },
              },
            ]}
          />
        </Card>
      )}

      {/* ── Contacts Tab ──────────────────────────────────────── */}
      {activeTab === 'contacts' && (
        <Card variant="elevated" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Contacts</h2>
          </div>
          <DataTable
            data={contacts ?? []}
            rowKey={(c) => c.id}
            emptyMessage="No contacts yet."
            columns={[
              {
                header: 'Name',
                accessor: (c) => (
                  <span style={{ fontWeight: 500, color: 'var(--_color---text--primary)' }}>
                    {c.full_name}
                    {c.is_primary && (
                      <Badge status="info" style={{ marginLeft: '8px' }}>Primary</Badge>
                    )}
                  </span>
                ),
              },
              {
                header: 'Title',
                accessor: (c) => c.title || '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Email',
                accessor: (c) => c.email || '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Phone',
                accessor: (c) => c.phone || '—',
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: 'Role',
                accessor: (c) => (
                  <Badge status="neutral">
                    {c.role.charAt(0).toUpperCase() + c.role.slice(1)}
                  </Badge>
                ),
              },
              {
                header: 'Portal',
                accessor: (c) => (
                  <Badge status={c.user_id ? 'positive' : 'neutral'}>
                    {c.user_id ? 'Active' : 'No access'}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
