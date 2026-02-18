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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const textareaLabelStyle = {
  fontFamily: 'var(--_typography---font-family--label)',
  fontWeight: 'var(--font-weight--semi-bold)' as unknown as number,
  fontSize: 'var(--_typography---label--md-base)',
  lineHeight: 'var(--font-line-height--100)',
  color: 'var(--_color---text--primary)',
};

export default function NewClientPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          name,
          slug: toSlug(name),
          address: address || null,
          phone: phone || null,
          industry: industry || null,
          website_url: websiteUrl || null,
          notes: notes || null,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/admin/clients');
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
          Add Client
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Complete this form to begin the new client workflow.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              fullWidth
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput
                label="Phone"
                type="tel"
                placeholder="(555)-555-5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--_space---gap--md)',
                width: '100%',
              }}
            >
              <label style={textareaLabelStyle}>Notes</label>
              <TextArea
                placeholder="Placeholder"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
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

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <a href="/admin/clients">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Creating...' : 'Begin'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
