'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
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

const textareaStyle = {
  width: '100%',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: 'var(--_typography---body--sm)',
  lineHeight: 'var(--font-line-height--150)',
  padding: 'var(--_space---input)',
  borderRadius: 'var(--_border-radius---input)',
  border: 'var(--_border-width---sm) solid var(--_color---border--input)',
  backgroundColor: 'var(--_color---background--input)',
  color: 'var(--_color---text--primary)',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const,
};

const textareaLabelStyle = {
  display: 'block' as const,
  marginBottom: 'var(--_space---sm, 8px)',
  fontFamily: 'var(--_typography---font-family--label)',
  fontWeight: 'var(--font-weight--semi-bold)' as string,
  fontSize: 'var(--_typography---label--md-base)',
  color: 'var(--_color---text--primary)',
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
          <TextInput
            label="Company name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Archived', value: 'archived' },
            ]}
            fullWidth
          />

          <Select
            label="Contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            placeholder="— No Contact —"
            options={users.map((user) => ({
              label: user.full_name || user.email,
              value: user.id,
            }))}
            fullWidth
          />

          <TextInput
            label="Website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            fullWidth
          />

          <div>
            <label style={textareaLabelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </div>
        </div>

        {error && (
          <p
            style={{
              color: 'var(--system--red, #eb5757)',
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: 'var(--_typography---body--sm)',
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
