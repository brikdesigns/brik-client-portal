'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          name,
          slug: toSlug(name),
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          website_url: websiteUrl || null,
          notes: notes || null,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/admin/clients');
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
          Add client
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Create a new client account.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Company name"
              type="text"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Contact name"
                type="text"
                placeholder="Jane Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                fullWidth
              />
              <Input
                label="Contact email"
                type="email"
                placeholder="jane@acme.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                fullWidth
              />
            </div>
            <Input
              label="Website"
              type="url"
              placeholder="https://acme.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              fullWidth
            />
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--_typography---font-family--label)',
                  fontSize: 'var(--_typography---label--sm, 12px)',
                  fontWeight: 600,
                  color: 'var(--_color---text--secondary)',
                  marginBottom: '6px',
                }}
              >
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this client..."
                rows={3}
                style={{
                  width: '100%',
                  fontFamily: 'var(--_typography---font-family--body)',
                  fontSize: '14px',
                  padding: '8px 12px',
                  borderRadius: 'var(--_border-radius---sm, 4px)',
                  border: '1px solid var(--_color---border--input)',
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
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Creating...' : 'Create client'}
            </Button>
            <a href="/admin/clients">
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
