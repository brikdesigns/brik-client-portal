import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditClientForm } from '@/components/edit-client-form';

interface Props {
  params: { id: string };
}

export default async function EditClientPage({ params }: Props) {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, status, contact_name, contact_email, website_url, notes')
    .eq('id', params.id)
    .single();

  if (error || !client) {
    notFound();
  }

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
          Edit client
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

      <EditClientForm client={client} />
    </div>
  );
}
