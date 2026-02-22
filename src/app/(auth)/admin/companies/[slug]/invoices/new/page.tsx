'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';

export default function NewInvoicePage() {
  const params = useParams();
  const clientSlug = params.slug as string;
  const [clientId, setClientId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('draft');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function resolveClient() {
      const supabase = createClient();
      const { data } = await supabase.from('companies').select('id').eq('slug', clientSlug).single();
      if (data) setClientId(data.id);
    }
    resolveClient();
  }, [clientSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setError('');

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          company_id: clientId,
          description: description || null,
          amount_cents: Math.round(amountFloat * 100),
          currency: 'usd',
          status,
          invoice_date: invoiceDate || null,
          due_date: dueDate || null,
          invoice_url: invoiceUrl || null,
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
          Add invoice
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Create a new invoice for this client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextInput
              label="Description"
              type="text"
              placeholder="Website design — Phase 1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput
                label="Amount (USD)"
                type="number"
                placeholder="2500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Open', value: 'open' },
                  { label: 'Paid', value: 'paid' },
                ]}
                fullWidth
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput
                label="Invoice date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                fullWidth
              />
              <TextInput
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
              />
            </div>
            <TextInput
              label="Invoice URL (Stripe or PDF link)"
              type="url"
              placeholder="https://invoice.stripe.com/..."
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              fullWidth
            />
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
              {loading ? 'Creating...' : 'Create invoice'}
            </Button>
            <a href={`/admin/companies/${clientSlug}`}>
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
