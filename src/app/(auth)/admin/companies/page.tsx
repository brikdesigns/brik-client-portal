import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { CompanyStatusBadge, CompanyTypeTag } from '@/components/status-badges';
import { CompanyTabs } from '@/components/company-tabs';

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function AdminCompaniesPage({ searchParams }: Props) {
  const { type: typeFilter } = await searchParams;
  const supabase = createClient();

  // Always fetch all companies for accurate stat counts
  const { data: allCompanies } = await supabase
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

  const companies = allCompanies ?? [];

  // Stats from full dataset (always accurate regardless of tab)
  const leadCount = companies.filter((c) => c.type === 'lead').length;
  const prospectCount = companies.filter((c) => c.type === 'prospect').length;
  const clientCount = companies.filter((c) => c.type === 'client').length;

  // Filter for table display
  const validTypes = ['lead', 'prospect', 'client'];
  const tableData = typeFilter && validTypes.includes(typeFilter)
    ? companies.filter((c) => c.type === typeFilter)
    : companies;

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
        tabs={<CompanyTabs />}
      />

      {/* Stat cards — always visible */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Total Companies" value={companies.length} />
        <CardSummary label="Leads" value={leadCount} />
        <CardSummary label="Prospects" value={prospectCount} />
        <CardSummary label="Clients" value={clientCount} />
      </div>

      <Card variant="elevated" padding="lg">
        <DataTable
          data={tableData}
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
