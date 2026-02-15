'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

const labelStyle = {
  display: 'block' as const,
  fontFamily: 'var(--_typography---font-family--label)',
  fontSize: 'var(--_typography---label--sm, 12px)',
  fontWeight: 600,
  color: 'var(--_color---text--secondary)',
  marginBottom: '6px',
};

const selectStyle = {
  width: '100%',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '14px',
  padding: '8px 12px',
  borderRadius: 'var(--_border-radius---sm, 4px)',
  border: '1px solid var(--_color---border--input, #bdbdbd)',
  backgroundColor: 'var(--_color---background--input, white)',
  color: 'var(--_color---text--primary)',
  height: '40px',
  boxSizing: 'border-box' as const,
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
    <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Service name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                padding: '8px 12px',
                borderRadius: 'var(--_border-radius---sm, 4px)',
                border: '1px solid var(--_color---border--input, #bdbdbd)',
                backgroundColor: 'var(--_color---background--input, white)',
                color: 'var(--_color---text--primary)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={selectStyle}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Service type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                style={selectStyle}
              >
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
                <option value="add_on">Add-on</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Billing frequency</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value)}
                style={selectStyle}
              >
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <Input
            label="Base price (USD)"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Stripe product ID"
              type="text"
              value={stripeProductId}
              onChange={(e) => setStripeProductId(e.target.value)}
              fullWidth
            />
            <Input
              label="Stripe price ID"
              type="text"
              value={stripePriceId}
              onChange={(e) => setStripePriceId(e.target.value)}
              fullWidth
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                color: 'var(--_color---text--primary)',
              }}
            >
              Active
            </label>
          </div>
        </div>

        {error && (
          <p
            style={{
              color: 'var(--system--red, #eb5757)',
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '13px',
              margin: '16px 0 0',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <a href={`/admin/services/${service.slug}`}>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </Card>
  );
}
