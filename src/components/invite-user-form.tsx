'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

interface InviteUserFormProps {
  clients: { id: string; name: string }[];
}

const selectStyle = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '14px',
  padding: '8px 12px',
  borderRadius: 'var(--_border-radius---sm, 4px)',
  border: '1px solid var(--_color---border--input, #bdbdbd)',
  backgroundColor: 'var(--_color---background--input, white)',
  color: 'var(--_color---text--primary)',
  height: '40px',
};

const labelStyle = {
  display: 'block' as const,
  fontFamily: 'var(--_typography---font-family--label)',
  fontSize: 'var(--_typography---label--sm, 12px)',
  fontWeight: 600,
  color: 'var(--_color---text--secondary)',
  marginBottom: '6px',
};

export function InviteUserForm({ clients }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'admin'>('client');
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
      setError('Please select a client to assign this user to.');
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
          client_id: role === 'client' ? clientId : null,
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
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <Input
          label="Email"
          type="email"
          placeholder="client@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <Input
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
          gap: '16px',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label style={labelStyle}>Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'client' | 'admin');
              if (e.target.value === 'admin') setClientId('');
            }}
            style={selectStyle}
          >
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {role === 'client' && (
          <div>
            <label style={labelStyle}>Assign to client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Sending...' : 'Send invite'}
        </Button>
      </div>

      {error && (
        <p
          style={{
            color: 'var(--system--red, #eb5757)',
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '13px',
            margin: '12px 0 0',
          }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          style={{
            color: 'var(--system--green, #27ae60)',
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '13px',
            margin: '12px 0 0',
          }}
        >
          {success}
        </p>
      )}
    </form>
  );
}
