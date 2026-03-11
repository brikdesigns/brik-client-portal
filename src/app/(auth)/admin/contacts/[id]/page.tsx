import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ContactDetailTabs } from '@/components/contact-detail-tabs';
import { gap } from '@/lib/tokens';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      title,
      role,
      is_primary,
      user_id,
      notes,
      created_at,
      updated_at,
      companies(id, name, slug, type)
    `)
    .eq('id', id)
    .single();

  if (error || !contact) {
    notFound();
  }

  const company = contact.companies as unknown as { id: string; name: string; slug: string; type: string } | null;

  // Fetch profile, connected companies, and activity in parallel
  const [profileResult, companiesResult, activityResult] = await Promise.all([
    contact.user_id
      ? supabase
          .from('profiles')
          .select('role, is_active, last_login_at')
          .eq('id', contact.user_id)
          .single()
      : Promise.resolve({ data: null }),
    contact.user_id
      ? supabase
          .from('company_users')
          .select('role, companies(id, name, slug, type)')
          .eq('user_id', contact.user_id)
      : Promise.resolve({ data: null }),
    contact.user_id
      ? supabase
          .from('user_activity')
          .select('id, event_type, ip_address, user_agent, created_at')
          .eq('user_id', contact.user_id)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileResult.data;

  let connectedCompanies = (companiesResult.data ?? []).map((cu) => {
    const comp = (cu as unknown as { companies: { id: string; name: string; slug: string; type: string } }).companies;
    return { ...comp, role: cu.role };
  });

  // Fall back to the contact's own company if no company_users entries
  if (connectedCompanies.length === 0 && company) {
    connectedCompanies = [{ ...company, role: contact.role }];
  }

  const activity = activityResult.data ?? [];

  return (
    <div>
      <PageHeader
        title={contact.full_name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Contacts', href: '/admin/contacts' },
              { label: contact.full_name },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: gap.md }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${contact.id}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={[]}
      />

      <ContactDetailTabs
        contact={contact}
        company={company}
        profile={profile}
        connectedCompanies={connectedCompanies}
        activity={activity}
      />
    </div>
  );
}
