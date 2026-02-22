import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditCompanyForm } from '@/components/edit-company-form';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: client, error } = await supabase
    .from('companies')
    .select('id, name, slug, type, status, contact_id, contact_name, contact_email, website_url, notes, address, phone, industry')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch all users for the contact dropdown
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--large, 28px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: 0,
          }}
        >
          Edit company
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Update {client.name}&apos;s details.
        </p>
      </div>

      <EditCompanyForm client={client} users={users ?? []} />
    </div>
  );
}
