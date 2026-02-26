'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';

const iconSize = { width: 14, height: 14 };

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)})-${d.slice(3)}`;
  return `(${d.slice(0, 3)})-${d.slice(3, 6)}-${d.slice(6)}`;
}

const roleOptions = [
  { label: 'Client', value: 'client' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

interface NewContactFormProps {
  companies: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
}

export function NewContactForm({ companies, defaultCompanyId }: NewContactFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('client');
  const [isPrimary, setIsPrimary] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(formatPhone(raw));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert({
          full_name: fullName,
          email: email || null,
          phone: phone || null,
          title: title || null,
          role,
          is_primary: isPrimary,
          company_id: companyId,
          notes: notes || null,
        })
        .select('id')
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/admin/contacts/${data.id}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" padding="lg" style={{ maxWidth: '640px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--_space---gap--lg)' }}>
          <TextInput
            label="Full Name"
            type="text"
            placeholder="Enter full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--_space---gap--lg)',
            }}
          >
            <TextInput
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextInput
              label="Phone"
              type="tel"
              inputMode="numeric"
              placeholder="(555)-555-5555"
              value={phone}
              onChange={handlePhoneChange}
              iconBefore={<FontAwesomeIcon icon={faPhone} style={iconSize} />}
              fullWidth
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--_space---gap--lg)',
            }}
          >
            <TextInput
              label="Title"
              type="text"
              placeholder="e.g. Office Manager"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
              fullWidth
            />
          </div>

          <Select
            label="Company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Select a company"
            options={companies.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            fullWidth
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            <label
              htmlFor="is-primary"
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: 'var(--_typography---body--sm)',
                color: 'var(--_color---text--primary)',
              }}
            >
              Primary contact for this company
            </label>
          </div>

          <TextArea
            label="Notes"
            placeholder="Internal notes about this contact..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            fullWidth
          />
        </div>

        {error && (
          <p
            style={{
              color: 'var(--system--red, #eb5757)',
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: 'var(--_typography---body--sm)',
              margin: 'var(--_space---lg) 0 0',
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 'var(--_space---gap--md)',
            marginTop: 'var(--_space---xl)',
            justifyContent: 'flex-end',
          }}
        >
          <a href="/admin/contacts">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
          <Button type="submit" variant="primary" size="md" disabled={loading || !companyId}>
            {loading ? 'Creating...' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
