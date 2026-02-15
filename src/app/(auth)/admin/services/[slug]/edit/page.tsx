import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditServiceForm } from '@/components/edit-service-form';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select(
      'id, name, slug, description, category_id, service_type, billing_frequency, base_price_cents, stripe_product_id, stripe_price_id, active'
    )
    .eq('slug', slug)
    .single();

  if (error || !service) {
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
          Edit service
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Update {service.name}.
        </p>
      </div>

      <EditServiceForm service={service} />
    </div>
  );
}
