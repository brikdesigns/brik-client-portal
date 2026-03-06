import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditCompanyForm } from '@/components/edit-company-form';
import { heading } from '@/lib/styles';
import { font, color, space, gap } from '@/lib/tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditClientPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: client, error } = await supabase
    .from('companies')
    .select('id, name, slug, type, status, contact_id, contact_name, contact_email, website_url, notes, address, city, state, postal_code, country, phone, industry')
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
      <div style={{ marginBottom: space.xl }}>
        <h1 style={heading.page}>
          Edit company
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Update {client.name}&apos;s details.
        </p>
      </div>

      <EditCompanyForm client={client} users={users ?? []} />
    </div>
  );
}
