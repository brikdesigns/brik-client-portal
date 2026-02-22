'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ServiceBadge } from '@/components/service-badge';
import { formatCurrency } from '@/lib/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Service {
  id: string;
  name: string;
  slug: string;
  base_price_cents: number | null;
  service_type: string;
  service_categories: { slug: string; name: string } | null;
}

interface LineItem {
  key: string;
  service_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

const iconSize = { width: 12, height: 12 };

export default function NewProposalPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load client + services on mount
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: client } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (client) {
        setClientId(client.id);
        setClientName(client.name);
        setTitle(`Proposal for ${client.name}`);
      }

      const { data: svcData } = await supabase
        .from('services')
        .select('id, name, slug, base_price_cents, service_type, service_categories(slug, name)')
        .order('name');

      if (svcData) {
        setServices(svcData as unknown as Service[]);
      }
    }

    load();
  }, [slug]);

  function addItem() {
    setItems([
      ...items,
      {
        key: crypto.randomUUID(),
        service_id: '',
        name: '',
        description: '',
        quantity: 1,
        unit_price_cents: 0,
      },
    ]);
  }

  function removeItem(key: string) {
    setItems(items.filter((item) => item.key !== key));
  }

  function updateItem(key: string, updates: Partial<LineItem>) {
    setItems(items.map((item) => (item.key === key ? { ...item, ...updates } : item)));
  }

  function handleServiceSelect(key: string, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      updateItem(key, {
        service_id: serviceId,
        name: service.name,
        unit_price_cents: service.base_price_cents || 0,
      });
    } else {
      updateItem(key, { service_id: '', name: '', unit_price_cents: 0 });
    }
  }

  const total = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a proposal title.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    const invalidItems = items.filter((item) => !item.name.trim() || item.unit_price_cents <= 0);
    if (invalidItems.length > 0) {
      setError('Each line item needs a name and price.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: clientId,
          title: title.trim(),
          valid_until: validUntil || null,
          notes: notes || null,
          items: items.map((item, index) => ({
            service_id: item.service_id || undefined,
            name: item.name,
            description: item.description || undefined,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            sort_order: index,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create proposal.');
        return;
      }

      router.push(`/admin/companies/${slug}/proposals/${data.proposal.id}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600 as const,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  return (
    <div>
      <PageHeader
        title={`Create Proposal`}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: clientName || '...', href: `/admin/companies/${slug}` },
              { label: 'New Proposal' },
            ]}
          />
        }
      />

      <form onSubmit={handleSubmit}>
        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--_space---gap--lg)' }}>
            <TextInput
              label="Proposal Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />

            <TextInput
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Line Items</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <FontAwesomeIcon icon={faPlus} style={iconSize} /> Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                color: 'var(--_color---text--muted)',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No line items yet. Click &quot;Add Item&quot; to add services to this proposal.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => {
                const selectedService = services.find((s) => s.id === item.service_id);
                const categorySlug = selectedService?.service_categories?.slug;

                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '16px',
                      border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
                      borderRadius: 'var(--_border-radius---md)',
                      backgroundColor: 'var(--_color---surface--secondary)',
                    }}
                  >
                    {categorySlug && (
                      <div style={{ paddingTop: '28px' }}>
                        <ServiceBadge category={categorySlug} size={16} />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Select
                        label="Service"
                        value={item.service_id}
                        onChange={(e) => handleServiceSelect(item.key, e.target.value)}
                        placeholder="Custom item"
                        options={services.map((s) => ({ label: s.name, value: s.id }))}
                        fullWidth
                      />
                      {!item.service_id && (
                        <TextInput
                          label="Item Name"
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.key, { name: e.target.value })}
                          placeholder="Custom line item name"
                          fullWidth
                        />
                      )}
                      <TextInput
                        label="Description"
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.key, { description: e.target.value })}
                        placeholder="Optional description"
                        fullWidth
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <TextInput
                          label="Qty"
                          type="number"
                          value={String(item.quantity)}
                          onChange={(e) => updateItem(item.key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          fullWidth
                        />
                        <TextInput
                          label="Unit Price"
                          type="number"
                          value={String(item.unit_price_cents / 100)}
                          onChange={(e) => updateItem(item.key, { unit_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                          fullWidth
                        />
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--_typography---font-family--body)',
                          fontSize: '13px',
                          color: 'var(--_color---text--secondary)',
                          margin: 0,
                          textAlign: 'right',
                        }}
                      >
                        Subtotal: {formatCurrency(item.unit_price_cents * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--_color---text--muted)',
                        padding: '4px',
                        marginTop: '24px',
                      }}
                      aria-label="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '8px',
                  borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--_typography---font-family--heading)',
                    fontSize: 'var(--_typography---heading--small, 18px)',
                    fontWeight: 600,
                    color: 'var(--_color---text--primary)',
                    margin: 0,
                  }}
                >
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px' }}>
          <TextArea
            label="Notes (internal)"
            placeholder="Internal notes — not visible to the client..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            fullWidth
          />

          {error && (
            <p
              style={{
                color: 'var(--system--red, #eb5757)',
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: 'var(--_typography---body--sm)',
                margin: 'var(--_space---lg) 0 0',
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 'var(--_space---gap--md)',
              marginTop: 'var(--_space---xl)',
              justifyContent: 'flex-end',
            }}
          >
            <a href={`/admin/companies/${slug}`}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Creating...' : 'Create Draft'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
