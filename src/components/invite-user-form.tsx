'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, gap, space } from '@/lib/tokens';

interface InviteUserFormProps {
  clients: { id: string; name: string }[];
}

export function InviteUserForm({ clients }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'client'>('client');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (role === 'client' && !clientId) {
      setError('Please select a company to assign this user to.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          company_id: role === 'client' ? clientId : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation.');
        return;
      }

      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setFullName('');
      setRole('client');
      setClientId('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: gap.lg,
          marginBottom: space.md,
        }}
      >
        <TextInput
          label="Email"
          type="email"
          placeholder="client@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextInput
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: gap.lg,
          alignItems: 'flex-end',
        }}
      >
        <Select
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as 'super_admin' | 'client');
            if (e.target.value !== 'client') setClientId('');
          }}
          placeholder="Select role"
          options={[
            { label: 'Client', value: 'client' },
            { label: 'Brik Admin', value: 'super_admin' },
          ]}
        />

        {role === 'client' && (
          <Select
            label="Assign to client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Select a client..."
            options={clients.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            fullWidth
          />
        )}

        <Button type="submit" variant="primary" size="md" loading={loading}>
          Send invite
        </Button>
      </div>

      {error && (
        <p
          style={{
            color: color.system.red,
            fontFamily: font.family.body,
            fontSize: font.size.body.xs,
            margin: `${space.sm} 0 0`,
          }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          style={{
            color: color.system.green,
            fontFamily: font.family.body,
            fontSize: font.size.body.xs,
            margin: `${space.sm} 0 0`,
          }}
        >
          {success}
        </p>
      )}
    </form>
  );
}
