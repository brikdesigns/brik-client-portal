import { createClient } from '@/lib/supabase/server';
import { ContactsPageContent, type ContactRow } from '@/components/contacts-page-content';

export default async function AdminContactsPage() {
  const supabase = await createClient();

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

  return <ContactsPageContent contacts={(contacts ?? []) as unknown as ContactRow[]} />;
}
