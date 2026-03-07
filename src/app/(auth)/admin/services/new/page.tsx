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
  fontSize: font.size.body.sm,
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

export default function NewServicePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serviceType, setServiceType] = useState('one_time');
  const [billingFrequency, setBillingFrequency] = useState('one_time');
  const [basePrice, setBasePrice] = useState('');
  const [stripeProductId, setStripeProductId] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [active, setActive] = useState(true);
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

      const { error: insertError } = await supabase.from('services').insert({
        name,
        slug: toSlug(name),
        description: description || null,
        category_id: categoryId || null,
        service_type: serviceType,
        billing_frequency: billingFrequency,
        base_price_cents: priceCents,
        stripe_product_id: stripeProductId || null,
        stripe_price_id: stripePriceId || null,
        active,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/admin/services');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
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
          Add service
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Add a new service to the catalog.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <TextInput
              label="Service name"
              type="text"
              placeholder="Logo Design"
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
                placeholder="Brief description of this service..."
                rows={3}
                style={textareaStyle}
              />
            </div>

            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="No category"
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              fullWidth
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
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
              placeholder="0.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
              <TextInput
                label="Stripe product ID"
                type="text"
                placeholder="prod_..."
                value={stripeProductId}
                onChange={(e) => setStripeProductId(e.target.value)}
                fullWidth
              />
              <TextInput
                label="Stripe price ID"
                type="text"
                placeholder="price_..."
                value={stripePriceId}
                onChange={(e) => setStripePriceId(e.target.value)}
                fullWidth
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
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
                  fontSize: font.size.body.sm,
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
                fontSize: font.size.body.xs,
                margin: `${space.md} 0 0`,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: gap.sm, marginTop: space.lg }}>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create service
            </Button>
            <a href="/admin/services">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </a>
          </div>
      </form>
    </div>
  );
}
