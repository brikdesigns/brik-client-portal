'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Button } from '@bds/components/ui/Button/Button';
import { heading } from '@/lib/styles';
import { font, color, space, gap, border } from '@/lib/tokens';

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
      const { data } = await supabase.from('companies').select('id').eq('slug', clientSlug).single();
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
          company_id: clientId,
          name,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
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
          Add project
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Create a new project for this client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
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
              <label
                style={{
                  display: 'block',
                  fontFamily: font.family.label,
                  fontSize: font.size.label.sm,
                  fontWeight: font.weight.semibold,
                  color: color.text.secondary,
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
                  fontFamily: font.family.body,
                  fontSize: font.size.body.sm,
                  padding: `${gap.xs} ${gap.sm}`,
                  borderRadius: border.radius.sm,
                  border: `${border.width.sm} solid ${color.border.input}`,
                  backgroundColor: color.background.input,
                  color: color.text.primary,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
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
              {loading ? 'Creating...' : 'Create project'}
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
