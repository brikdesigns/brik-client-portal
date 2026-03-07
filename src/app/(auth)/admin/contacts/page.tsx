import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { ContactsFilterTable, type ContactRow } from '@/components/contacts-filter-table';

export default async function AdminContactsPage() {
  const supabase = createClient();

  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      full_name,
      email,
      phone,
      title,
      role,
      is_primary,
      user_id,
      companies(name, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People at your companies — clients, managers, and admins."
        actions={
          <Button variant="primary" size="sm" asLink href="/admin/contacts/new">
            Add Contact
          </Button>
        }
      />

      <ContactsFilterTable contacts={(contacts ?? []) as unknown as ContactRow[]} />
    </div>
  );
}
