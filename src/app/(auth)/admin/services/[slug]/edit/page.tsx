import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditServiceForm } from '@/components/edit-service-form';
import { font, color, space, gap } from '@/lib/tokens';

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
      <div style={{ marginBottom: space.xl }}>
        <h1
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.large,
            fontWeight: font.weight.semibold,
            color: color.text.primary,
            margin: 0,
          }}
        >
          Edit service
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Update {service.name}.
        </p>
      </div>

      <EditServiceForm service={service} />
    </div>
  );
}
