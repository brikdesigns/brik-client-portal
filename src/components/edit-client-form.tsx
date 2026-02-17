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

interface EditClientFormProps {
  client: {
    id: string;
    name: string;
    slug?: string;
    status: string;
    contact_id: string | null;
    contact_name: string | null;
    contact_email: string | null;
    website_url: string | null;
    notes: string | null;
  };
  users: Array<{ id: string; full_name: string | null; email: string }>;
}

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

export function EditClientForm({ client, users }: EditClientFormProps) {
  const [name, setName] = useState(client.name);
  const [status, setStatus] = useState(client.status);
  const [contactId, setContactId] = useState(client.contact_id ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(client.website_url ?? '');
  const [notes, setNotes] = useState(client.notes ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const newSlug = toSlug(name);
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name,
          slug: newSlug,
          status,
          contact_id: contactId || null,
          website_url: websiteUrl || null,
          notes: notes || null,
        })
        .eq('id', client.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/admin/clients/${newSlug}`);
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
            label="Company name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Contact</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              style={selectStyle}
            >
              <option value="">— No Contact —</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            fullWidth
          />
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <a href={`/admin/clients/${client.slug}`}>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </Card>
  );
}
