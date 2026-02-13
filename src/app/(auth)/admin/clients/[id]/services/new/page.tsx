'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { Button } from '@bds/components/ui/Button/Button';
import { formatCurrency } from '@/lib/format';

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

interface Service {
  id: string;
  name: string;
  service_type: string;
  base_price_cents: number | null;
  billing_frequency: string | null;
  service_categories: { name: string } | null;
}

export default function AssignServicePage() {
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  useEffect(() => {
    async function loadServices() {
      const supabase = createClient();

      // Get services not already assigned to this client
      const { data: assigned } = await supabase
        .from('client_services')
        .select('service_id')
        .eq('client_id', clientId);

      const assignedIds = (assigned ?? []).map((a) => a.service_id);

      let query = supabase
        .from('services')
        .select('id, name, service_type, base_price_cents, billing_frequency, service_categories(name)')
        .eq('active', true)
        .order('name');

      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const { data } = await query;
      if (data) setServices(data as unknown as Service[]);
    }
    loadServices();
  }, [clientId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!serviceId) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('client_services').insert({
        client_id: clientId,
        service_id: serviceId,
        status: 'active',
        notes: notes || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

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
          Assign service
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Add a service to this client&apos;s account.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Service</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="">Select a service...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.service_categories ? ` (${s.service_categories.name})` : ''}
                    {s.base_price_cents
                      ? ` — ${formatCurrency(s.base_price_cents)}${s.billing_frequency === 'monthly' ? '/mo' : ''}`
                      : ''}
                  </option>
                ))}
              </select>
              {services.length === 0 && (
                <p
                  style={{
                    fontFamily: 'var(--_typography---font-family--body)',
                    fontSize: '13px',
                    color: 'var(--_color---text--muted)',
                    margin: '8px 0 0',
                  }}
                >
                  All services are already assigned or no active services exist.
                </p>
              )}
            </div>

            {selectedService && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--_color---surface--secondary)',
                  borderRadius: '6px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--_typography---font-family--body)',
                    fontSize: '13px',
                    color: 'var(--_color---text--secondary)',
                    margin: 0,
                  }}
                >
                  {selectedService.service_type === 'recurring' ? 'Recurring' : 'One-time'} service
                  {selectedService.base_price_cents
                    ? ` · ${formatCurrency(selectedService.base_price_cents)}${selectedService.billing_frequency === 'monthly' ? '/mo' : ''}`
                    : ''}
                </p>
              </div>
            )}

            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this assignment..."
                rows={2}
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
            <Button type="submit" variant="primary" size="md" disabled={loading || !serviceId}>
              {loading ? 'Assigning...' : 'Assign service'}
            </Button>
            <a href={`/admin/clients/${clientId}`}>
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
