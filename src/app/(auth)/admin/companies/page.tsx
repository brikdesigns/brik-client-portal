import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { CompanyStatusBadge, CompanyTypeTag } from '@/components/status-badges';

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function AdminCompaniesPage({ searchParams }: Props) {
  const { type: typeFilter } = await searchParams;
  const supabase = createClient();

  let query = supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      type,
      status,
      contact_email,
      contact_name,
      created_at,
      projects(id),
      invoices(id, status)
    `)
    .order('name');

  if (typeFilter === 'lead' || typeFilter === 'prospect' || typeFilter === 'client') {
    query = query.eq('type', typeFilter);
  }

  const { data: companies } = await query;

  // Counts for stat cards
  const allCompanies = companies ?? [];
  const leadCount = allCompanies.filter((c) => c.type === 'lead').length;
  const prospectCount = allCompanies.filter((c) => c.type === 'prospect').length;
  const clientCount = allCompanies.filter((c) => c.type === 'client').length;

  // Tab styles
  const tabStyle = (active: boolean) => ({
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--_color---text--primary)' : 'var(--_color---text--secondary)',
    textDecoration: 'none' as const,
    padding: '8px 16px',
    borderBottom: active ? '2px solid var(--brand--primary, #E35335)' : '2px solid transparent',
    display: 'inline-block',
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Manage leads and client accounts."
        actions={
          <Button variant="primary" size="md" asLink href="/admin/companies/new">
            Add New
          </Button>
        }
      />

      {/* Stat cards */}
      {!typeFilter && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <CardSummary label="Total companies" value={allCompanies.length} />
          <CardSummary label="Leads" value={leadCount} />
          <CardSummary label="Prospects" value={prospectCount} />
          <CardSummary label="Clients" value={clientCount} />
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          borderBottom: '1px solid var(--_color---border--default, #e5e5e5)',
          marginBottom: '24px',
        }}
      >
        <a href="/admin/companies" style={tabStyle(!typeFilter)}>All</a>
        <a href="/admin/companies?type=lead" style={tabStyle(typeFilter === 'lead')}>Leads</a>
        <a href="/admin/companies?type=prospect" style={tabStyle(typeFilter === 'prospect')}>Prospects</a>
        <a href="/admin/companies?type=client" style={tabStyle(typeFilter === 'client')}>Clients</a>
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={allCompanies}
          rowKey={(c) => c.id}
          emptyMessage={
            typeFilter === 'lead'
              ? 'No leads yet. Add your first lead to get started.'
              : typeFilter === 'prospect'
                ? 'No prospects yet. Qualify a lead to create one.'
                : typeFilter === 'client'
                  ? 'No clients yet.'
                  : 'No companies yet. Add your first company to get started.'
          }
          columns={[
            {
              header: 'Company',
              accessor: (c) => c.name,
              style: { fontWeight: 500 },
            },
            {
              header: 'Type',
              accessor: (c) => <CompanyTypeTag type={c.type} muted={c.status === 'not_active'} />,
            },
            {
              header: 'Contact',
              accessor: (c) => c.contact_email || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Status',
              accessor: (c) => <CompanyStatusBadge status={c.status} />,
            },
            {
              header: '',
              accessor: (c) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/companies/${c.slug}`}>
                  View
                </Button>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
