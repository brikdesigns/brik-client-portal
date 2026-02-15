'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

export default function NewProjectPage() {
  const params = useParams();
  const clientSlug = params.slug as string;
  const [clientId, setClientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function resolveClient() {
      const supabase = createClient();
      const { data } = await supabase.from('clients').select('id').eq('slug', clientSlug).single();
      if (data) setClientId(data.id);
    }
    resolveClient();
  }, [clientSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          name,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/admin/clients/${clientSlug}`);
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
          Create a new project for this client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Project name"
              type="text"
              placeholder="Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project description..."
                rows={3}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
              />
              <Input
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
            <a href={`/admin/clients/${clientSlug}`}>
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
