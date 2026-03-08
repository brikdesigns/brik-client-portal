'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { parseAddressString } from '@/lib/address';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { font, color, space, gap } from '@/lib/tokens';
import { useToast } from '@/components/toast-provider';

const iconSize = { width: 14, height: 14 };

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const statusOptions = [
  { label: 'Not Started', value: 'not_started' },
  { label: 'Needs Qualified', value: 'needs_qualified' },
  { label: 'Needs Proposal', value: 'needs_proposal' },
  { label: 'Active', value: 'active' },
  { label: 'Not Active', value: 'not_active' },
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
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
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
  const [city, setCity] = useState(client.city ?? '');
  const [state, setState] = useState(client.state ?? '');
  const [postalCode, setPostalCode] = useState(client.postal_code ?? '');
  const [country, setCountry] = useState(client.country ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [industry, setIndustry] = useState(client.industry ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(client.website_url ?? '');
  const [notes, setNotes] = useState(client.notes ?? '');
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
      const newSlug = toSlug(name);
      // If structured fields are empty, extract them from the address string
      let finalCity = city;
      let finalState = state;
      let finalPostalCode = postalCode;
      if (!city && !state && !postalCode && address) {
        const parsed = parseAddressString(address);
        finalCity = parsed.city ?? '';
        finalState = parsed.state ?? '';
        finalPostalCode = parsed.postalCode ?? '';
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name,
          slug: newSlug,
          status,
          contact_id: contactId || null,
          address: address || null,
          city: finalCity || null,
          state: finalState || null,
          postal_code: finalPostalCode || null,
          country: country || null,
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

      toastSuccess(`${name} saved successfully`);
      router.push(`/admin/companies/${newSlug}`);
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
            placeholder="Select status"
            options={statusOptions}
            fullWidth
          />

          <AddressAutocomplete
            label="Business Address"
            placeholder="Enter business address"
            value={address}
            onChange={setAddress}
            onSelect={(result) => {
              setCity(result.city ?? '');
              setState(result.state ?? '');
              setPostalCode(result.postcode ?? '');
              setCountry(result.country ?? '');
            }}
            fullWidth
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: gap.lg,
            }}
          >
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
          <a href={`/admin/companies/${client.slug}`}>
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save changes
          </Button>
        </div>
    </form>
  );
}
