'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';

const iconSize = { width: 14, height: 14 };

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)})-${d.slice(3)}`;
  return `(${d.slice(0, 3)})-${d.slice(3, 6)}-${d.slice(6)}`;
}

const leadStatusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Working', value: 'working' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Unqualified', value: 'unqualified' },
];

const clientStatusOptions = [
  { label: 'Prospect', value: 'prospect' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

interface EditCompanyFormProps {
  client: {
    id: string;
    name: string;
    slug?: string;
    type?: string;
    status: string;
    contact_id: string | null;
    contact_name: string | null;
    contact_email: string | null;
    website_url: string | null;
    notes: string | null;
    address: string | null;
    phone: string | null;
    industry: string | null;
  };
  users: Array<{ id: string; full_name: string | null; email: string }>;
}

export function EditCompanyForm({ client, users }: EditCompanyFormProps) {
  const [name, setName] = useState(client.name);
  const [status, setStatus] = useState(client.status);
  const [contactId, setContactId] = useState(client.contact_id ?? '');
  const [address, setAddress] = useState(client.address ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [industry, setIndustry] = useState(client.industry ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(client.website_url ?? '');
  const [notes, setNotes] = useState(client.notes ?? '');
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
      const newSlug = toSlug(name);
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name,
          slug: newSlug,
          status,
          contact_id: contactId || null,
          address: address || null,
          phone: phone || null,
          industry: industry || null,
          website_url: websiteUrl || null,
          notes: notes || null,
        })
        .eq('id', client.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/admin/companies/${newSlug}`);
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
            label="Business Name"
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
            options={client.type === 'lead' ? leadStatusOptions : clientStatusOptions}
            fullWidth
          />

          <AddressAutocomplete
            label="Business Address"
            placeholder="Enter business address"
            value={address}
            onChange={setAddress}
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
              label="Phone"
              type="tel"
              inputMode="numeric"
              placeholder="(555)-555-5555"
              value={phone}
              onChange={handlePhoneChange}
              iconBefore={<FontAwesomeIcon icon={faPhone} style={iconSize} />}
              fullWidth
            />
            <Select
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Select industry"
              options={[
                { label: 'Dental', value: 'dental' },
                { label: 'Real Estate', value: 'real-estate' },
              ]}
              fullWidth
            />
          </div>

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
            label="Website URL"
            type="url"
            placeholder="Enter URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            fullWidth
          />

          <TextArea
            label="Notes"
            placeholder="Internal notes about this company..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
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
          <a href={`/admin/companies/${client.slug}`}>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </a>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
