import { createClient } from '@/lib/supabase/server';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
import { PageHeader } from '@/components/page-header';
import { CompaniesFilterTable, type CompanyRow } from '@/components/companies-filter-table';
import { gap, space } from '@/lib/tokens';

export default async function AdminCompaniesPage() {
  const supabase = await createClient();

  const { data: allCompanies } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      type,
      status,
      industry,
      created_at,
      contacts!contacts_company_id_fkey(full_name, email, is_primary)
    `)
    .order('name');

  const companies: CompanyRow[] = (allCompanies ?? []).map((c) => {
    const contacts = (c as unknown as { contacts: Array<{ full_name: string; email: string | null; is_primary: boolean }> }).contacts ?? [];
    const primary = contacts.find((ct) => ct.is_primary) ?? contacts[0] ?? null;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: (c as unknown as { type: string }).type,
      status: c.status,
      contact_email: primary?.email ?? null,
      contact_name: primary?.full_name ?? null,
      industry: c.industry,
      created_at: c.created_at,
    };
  });

  const leadCount = companies.filter((c) => c.type === 'lead').length;
  const prospectCount = companies.filter((c) => c.type === 'prospect').length;
  const clientCount = companies.filter((c) => c.type === 'client').length;

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Manage leads and client accounts."
        actions={
          <LinkButton variant="primary" size="md" href="/admin/companies/new">
            Add Company
          </LinkButton>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: gap.lg,
          marginBottom: space.lg,
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
