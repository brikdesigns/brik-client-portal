'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap, border } from '@/lib/tokens';

const textareaStyle = {
  width: '100%',
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  lineHeight: font.lineHeight.normal,
  padding: space.input,
  borderRadius: border.radius.input,
  border: `${border.width.sm} solid ${color.border.input}`,
  backgroundColor: color.background.input,
  color: color.text.primary,
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const,
};

const textareaLabelStyle = {
  display: 'block' as const,
  marginBottom: space.sm,
  fontFamily: font.family.label,
  fontWeight: font.weight.medium,
  fontSize: font.size.label.md,
  color: color.text.primary,
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface EditServiceFormProps {
  service: {
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    category_id: string | null;
    service_type: string;
    billing_frequency: string | null;
    base_price_cents: number | null;
    stripe_product_id: string | null;
    stripe_price_id: string | null;
    active: boolean;
  };
}

export function EditServiceForm({ service }: EditServiceFormProps) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? '');
  const [categoryId, setCategoryId] = useState(service.category_id ?? '');
  const [serviceType, setServiceType] = useState(service.service_type);
  const [billingFrequency, setBillingFrequency] = useState(service.billing_frequency ?? 'one_time');
  const [basePrice, setBasePrice] = useState(
    service.base_price_cents ? (service.base_price_cents / 100).toString() : ''
  );
  const [stripeProductId, setStripeProductId] = useState(service.stripe_product_id ?? '');
  const [stripePriceId, setStripePriceId] = useState(service.stripe_price_id ?? '');
  const [active, setActive] = useState(service.active);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .order('sort_order');
      if (data) setCategories(data);
    }
    loadCategories();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const priceCents = basePrice ? Math.round(parseFloat(basePrice) * 100) : null;

      const newSlug = toSlug(name);
      const { error: updateError } = await supabase
        .from('services')
        .update({
          name,
          slug: newSlug,
          description: description || null,
          category_id: categoryId || null,
          service_type: serviceType,
          billing_frequency: billingFrequency,
          base_price_cents: priceCents,
          stripe_product_id: stripeProductId || null,
          stripe_price_id: stripePriceId || null,
          active,
        })
        .eq('id', service.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/admin/services/${newSlug}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
          <TextInput
            label="Service name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <div>
            <label style={textareaLabelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </div>

          <Select
            label="Service Line"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="No category"
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
            fullWidth
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.md }}>
            <Select
              label="Service type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Select type"
              options={[
                { label: 'One-time', value: 'one_time' },
                { label: 'Recurring', value: 'recurring' },
                { label: 'Add-on', value: 'add_on' },
              ]}
              fullWidth
            />
            <Select
              label="Billing frequency"
              value={billingFrequency}
              onChange={(e) => setBillingFrequency(e.target.value)}
              placeholder="Select frequency"
              options={[
                { label: 'One-time', value: 'one_time' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              fullWidth
            />
          </div>
          <TextInput
            label="Base price (USD)"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.md }}>
            <TextInput
              label="Stripe product ID"
              type="text"
              value={stripeProductId}
              onChange={(e) => setStripeProductId(e.target.value)}
              fullWidth
            />
            <TextInput
              label="Stripe price ID"
              type="text"
              value={stripePriceId}
              onChange={(e) => setStripePriceId(e.target.value)}
              fullWidth
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label
              htmlFor="active"
              style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.md,
                color: color.text.primary,
              }}
            >
              Active
            </label>
          </div>
        </div>

        {error && (
          <p
            style={{
              color: color.system.red,
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              margin: `${space.md} 0 0`,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: gap.md, marginTop: space.lg }}>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save changes
          </Button>
          <a href={`/admin/services/${service.slug}`}>
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
        </div>
    </form>
  );
}
