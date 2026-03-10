'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { formatCurrency } from '@/lib/format';
import { heading } from '@/lib/styles';
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
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const clientSlug = params.slug as string;

  useEffect(() => {
    async function loadServices() {
      const supabase = createClient();

      const { data: clientData } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', clientSlug)
        .single();
      if (!clientData) return;
      setClientId(clientData.id);

      const { data: assigned } = await supabase
        .from('company_services')
        .select('service_id')
        .eq('company_id', clientData.id);

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
  }, [clientSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!serviceId || !clientId) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('company_services').insert({
        company_id: clientId,
        service_id: serviceId,
        status: 'active',
        notes: notes || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/admin/companies/${clientSlug}`);
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
      <div style={{ marginBottom: space.xl }}>
        <h1 style={heading.page}>
          Assign service
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Add a service to this client&apos;s account.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div>
              <Select
                label="Service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="Select a service..."
                options={services.map((s) => ({
                  label: `${s.name}${s.service_categories ? ` (${s.service_categories.name})` : ''}${s.base_price_cents ? ` — ${formatCurrency(s.base_price_cents)}${s.billing_frequency === 'monthly' ? '/mo' : ''}` : ''}`,
                  value: s.id,
                }))}
                required
                fullWidth
              />
              {services.length === 0 && (
                <p
                  style={{
                    fontFamily: font.family.body,
                    fontSize: font.size.body.xs,
                    color: color.text.muted,
                    margin: `${gap.xs} 0 0`,
                  }}
                >
                  All services are already assigned or no active services exist.
                </p>
              )}
            </div>

            {selectedService && (
              <div
                style={{
                  padding: `${gap.sm} ${space.md}`,
                  backgroundColor: color.surface.secondary,
                  borderRadius: border.radius.sm,
                }}
              >
                <p
                  style={{
                    fontFamily: font.family.body,
                    fontSize: font.size.body.xs,
                    color: color.text.secondary,
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
              <label style={textareaLabelStyle}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this assignment..."
                rows={2}
                style={textareaStyle}
              />
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
            <Button type="submit" variant="primary" size="md" disabled={!serviceId || !clientId} loading={loading}>
              Assign service
            </Button>
            <a href={`/admin/companies/${clientSlug}`}>
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </a>
          </div>
      </form>
    </div>
  );
}
