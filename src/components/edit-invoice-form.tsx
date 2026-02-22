'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';

interface EditInvoiceFormProps {
  invoice: {
    id: string;
    company_id: string;
    description: string | null;
    amount_cents: number;
    status: string;
    invoice_date: string | null;
    due_date: string | null;
    paid_at: string | null;
    invoice_url: string | null;
  };
  clientName: string;
  clientSlug?: string;
}

export function EditInvoiceForm({ invoice, clientName, clientSlug }: EditInvoiceFormProps) {
  const [description, setDescription] = useState(invoice.description ?? '');
  const [amount, setAmount] = useState((invoice.amount_cents / 100).toString());
  const [status, setStatus] = useState(invoice.status);
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date ?? '');
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '');
  const [invoiceUrl, setInvoiceUrl] = useState(invoice.invoice_url ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {
        description: description || null,
        amount_cents: Math.round(amountFloat * 100),
        status,
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        invoice_url: invoiceUrl || null,
      };

      if (status === 'paid' && !invoice.paid_at) {
        updateData.paid_at = new Date().toISOString();
      } else if (status !== 'paid') {
        updateData.paid_at = null;
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push('/admin/invoices');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
      <div
        style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '13px',
          color: 'var(--_color---text--muted)',
          marginBottom: '20px',
        }}
      >
        Client: <a
          href={`/admin/companies/${clientSlug || invoice.company_id}`}
          style={{ color: 'var(--_color---system--link, #0034ea)', textDecoration: 'none' }}
        >
          {clientName}
        </a>
      </div>

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
                { label: 'Void', value: 'void' },
                { label: 'Uncollectible', value: 'uncollectible' },
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

          {status === 'paid' && !invoice.paid_at && (
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--services--green-dark)',
                margin: 0,
              }}
            >
              Paid date will be set to today automatically.
            </p>
          )}
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
          <a href="/admin/invoices">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </Card>
  );
}
