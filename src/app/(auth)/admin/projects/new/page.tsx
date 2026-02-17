'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';

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

interface Client {
  id: string;
  name: string;
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function NewProjectPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('not_started');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadClients() {
      const supabase = createClient();
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select a client.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase.from('projects').insert({
        client_id: clientId,
        name,
        slug: toSlug(name),
        description: description || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/admin/projects');
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
          Add project
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Create a new project for a client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Select a client..."
              options={clients.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
              fullWidth
            />
            <TextInput
              label="Project name"
              type="text"
              placeholder="Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <div>
              <label style={textareaLabelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project..."
                rows={3}
                style={textareaStyle}
              />
            </div>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: 'Not Started', value: 'not_started' },
                { label: 'In Progress', value: 'active' },
                { label: 'Complete', value: 'completed' },
                { label: 'On Hold', value: 'on_hold' },
                { label: 'Canceled', value: 'cancelled' },
              ]}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
              />
              <TextInput
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
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
              {loading ? 'Creating...' : 'Create project'}
            </Button>
            <a href="/admin/projects">
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
