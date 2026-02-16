'use client';

import { useState, type FormEvent } from 'react';
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
  border: '1px solid var(--_color---border--input)',
  backgroundColor: 'var(--_color---background--input, white)',
  color: 'var(--_color---text--primary)',
  height: '40px',
  boxSizing: 'border-box' as const,
};

interface EditInvoiceFormProps {
  invoice: {
    id: string;
    client_id: string;
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

      // Auto-set paid_at when marking as paid
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
          href={`/admin/clients/${clientSlug || invoice.client_id}`}
          style={{ color: 'var(--_color---system--link, #0034ea)', textDecoration: 'none' }}
        >
          {clientName}
        </a>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Description"
            type="text"
            placeholder="Website design — Phase 1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Amount (USD)"
              type="number"
              placeholder="2500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
            />
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
                <option value="uncollectible">Uncollectible</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Invoice date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              fullWidth
            />
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
            />
          </div>
          <Input
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
