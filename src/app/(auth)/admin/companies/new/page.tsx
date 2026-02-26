'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  if (d.length <= 6) return `(${d.slice(0, 3)})-${d.slice(3)}`;
  return `(${d.slice(0, 3)})-${d.slice(3, 6)}-${d.slice(6)}`;
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

      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          name,
          slug,
          type,
          status: defaultStatus,
          address: address || null,
          city: city || null,
          state: state || null,
          postal_code: postalCode || null,
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
    padding: '10px 16px',
    border: `2px solid ${active ? 'var(--brand--primary)' : 'var(--_color---border--secondary)'}`,
    borderRadius: '8px',
    background: active ? 'var(--_color---background--elevated)' : 'transparent',
    color: active ? 'var(--_color---text--primary)' : 'var(--_color---text--secondary)',
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer' as const,
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  });

  return (
    <div>
      <div style={{ marginBottom: 'var(--_space---xxl)' }}>
        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--large)',
            fontWeight: 'var(--font-weight--semi-bold)' as unknown as number,
            color: 'var(--_color---text--primary)',
            margin: 0,
          }}
        >
          Add {type === 'lead' ? 'Lead' : 'Client'}
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base)',
            color: 'var(--_color---text--secondary)',
            margin: 'var(--_space---md) 0 0',
          }}
        >
          {type === 'lead'
            ? 'Add a new lead to track through qualification.'
            : 'Complete this form to begin the new client workflow.'}
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--_space---gap--lg)',
            }}
          >
            {/* Type toggle */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--_typography---font-family--body)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--_color---text--primary)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Type
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
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
            <a href="/admin/companies">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Creating...' : type === 'lead' ? 'Add Lead' : 'Begin'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
