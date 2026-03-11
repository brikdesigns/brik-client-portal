'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { formatPhone } from '@/lib/format';
import { font, color, space, gap } from '@/lib/tokens';

const iconSize = { width: 14, height: 14 };

const roleOptions = [
  { label: 'Owner', value: 'owner' },
  { label: 'Office Manager', value: 'office_manager' },
  { label: 'Team Member', value: 'team_member' },
];

interface NewContactFormProps {
  companies: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
}

export function NewContactForm({ companies, defaultCompanyId }: NewContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('team_member');
  const [isPrimary, setIsPrimary] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess } = useToast();

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
          first_name: firstName,
          last_name: lastName,
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

      // Send welcome email if contact has an email address
      if (email) {
        try {
          const emailRes = await fetch('/api/admin/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: data.id }),
          });
          if (!emailRes.ok) {
            const body = await emailRes.json().catch(() => ({}));
            console.error('Welcome email failed:', emailRes.status, body);
          }
        } catch (err) {
          // Don't block navigation if email fails
          console.error('Welcome email network error:', err);
        }
      }

      toastSuccess('Contact added', `${firstName} ${lastName} has been added.`);
      router.push(`/admin/contacts/${data.id}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: gap.lg,
            }}
          >
            <TextInput
              label="First Name"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
            />
            <TextInput
              label="Last Name"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              fullWidth
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: gap.lg,
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
              placeholder="(555) 555-5555"
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
              gap: gap.lg,
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
              placeholder="Select role"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
            <input
              type="checkbox"
              id="is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            <label
              htmlFor="is-primary"
              style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.md,
                color: color.text.primary,
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
              color: color.system.red,
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              margin: `${space.lg} 0 0`,
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: gap.md,
            marginTop: space.xl,
            justifyContent: 'flex-end',
          }}
        >
          <a href="/admin/contacts">
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
          <Button type="submit" variant="primary" size="md" disabled={!companyId} loading={loading}>
            Add Contact
          </Button>
        </div>
    </form>
  );
}
