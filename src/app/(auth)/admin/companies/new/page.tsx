'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { parseAddressString } from '@/lib/address';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { heading } from '@/lib/styles';
import { font, color, space, gap, border } from '@/lib/tokens';
import { useToast } from '@/components/toast-provider';

const iconSize = { width: 14, height: 14 };

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function NewCompanyPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'lead' ? 'lead' : 'client';

  const [type, setType] = useState<'lead' | 'client'>(initialType);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
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
      const slug = toSlug(name);
      const defaultStatus = type === 'lead' ? 'needs_qualified' : 'active';

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

      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          name,
          slug,
          type,
          status: defaultStatus,
          address: address || null,
          city: finalCity || null,
          state: finalState || null,
          postal_code: finalPostalCode || null,
          country: country || null,
          phone: phone || null,
          industry: industry || null,
          website_url: websiteUrl || null,
          notes: notes || null,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      toastSuccess(`${name} added successfully`);
      router.push(`/admin/companies/${slug}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const toggleStyle = (active: boolean) => ({
    flex: 1,
    padding: `${space.xs} ${space.md}`,
    border: `2px solid ${active ? color.brand.primary : color.border.secondary}`,
    borderRadius: border.radius.lg,
    background: active ? color.background.elevated : 'transparent',
    color: active ? color.text.primary : color.text.secondary,
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    fontWeight: active ? font.weight.semibold : font.weight.regular,
    cursor: 'pointer' as const,
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  });

  return (
    <div>
      <div style={{ marginBottom: space.xxl }}>
        <h1 style={heading.page}>
          Add {type === 'lead' ? 'Lead' : 'Client'}
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${space.md} 0 0`,
          }}
        >
          {type === 'lead'
            ? 'Add a new lead to track through qualification.'
            : 'Complete this form to begin the new client workflow.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: gap.lg,
            }}
          >
            {/* Type toggle */}
            <div>
              <label
                style={{
                  fontFamily: font.family.body,
                  fontSize: font.size.body.xs,
                  fontWeight: font.weight.medium,
                  color: color.text.primary,
                  display: 'block',
                  marginBottom: gap.xs,
                }}
              >
                Type
              </label>
              <div style={{ display: 'flex', gap: gap.sm }}>
                <button type="button" style={toggleStyle(type === 'lead')} onClick={() => setType('lead')}>
                  Lead
                </button>
                <button type="button" style={toggleStyle(type === 'client')} onClick={() => setType('client')}>
                  Client
                </button>
              </div>
            </div>

            <TextInput
              label="Business Name"
              type="text"
              placeholder="Enter business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            <a href="/admin/companies">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              {type === 'lead' ? 'Add Lead' : 'Begin'}
            </Button>
          </div>
      </form>
    </div>
  );
}
