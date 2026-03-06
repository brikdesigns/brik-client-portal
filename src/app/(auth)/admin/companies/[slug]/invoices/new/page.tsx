'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { heading } from '@/lib/styles';
import { font, color, space, gap } from '@/lib/tokens';

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
      <div style={{ marginBottom: space.xl }}>
        <h1 style={heading.page}>
          Add invoice
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Create a new invoice for this client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <TextInput
              label="Description"
              type="text"
              placeholder="Website design — Phase 1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
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
