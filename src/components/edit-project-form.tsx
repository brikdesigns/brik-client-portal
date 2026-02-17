'use client';

import { useState, type FormEvent } from 'react';
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

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  clientName: string;
}

export function EditProjectForm({ project, clientName }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.start_date ?? '');
  const [endDate, setEndDate] = useState(project.end_date ?? '');
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
        .from('projects')
        .update({
          name,
          slug: newSlug,
          description: description || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .eq('id', project.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/admin/projects/${newSlug}`);
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
        Client: <span style={{ color: 'var(--_color---text--primary)', fontWeight: 500 }}>{clientName}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextInput
            label="Project name"
            type="text"
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
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <a href={`/admin/projects/${project.slug}`}>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </Card>
  );
}
