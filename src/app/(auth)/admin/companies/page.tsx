import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { CompaniesFilterTable, type CompanyRow } from '@/components/companies-filter-table';

export default async function AdminCompaniesPage() {
  const supabase = createClient();

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
      created_at
    `)
    .order('name');

  const companies: CompanyRow[] = (allCompanies ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: (c as unknown as { type: string }).type,
    status: c.status,
    contact_email: c.contact_email,
    contact_name: c.contact_name,
    created_at: c.created_at,
  }));

  const leadCount = companies.filter((c) => c.type === 'lead').length;
  const prospectCount = companies.filter((c) => c.type === 'prospect').length;
  const clientCount = companies.filter((c) => c.type === 'client').length;

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

      <CompaniesFilterTable companies={companies} />
    </div>
  );
}
