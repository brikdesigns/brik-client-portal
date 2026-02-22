'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';

interface EditUserFormProps {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    is_active: boolean;
    company_id: string | null;
  };
  clients: Array<{ id: string; name: string }>;
}

export function EditUserForm({ user, clients }: EditUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    company_id: user.company_id || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      router.push(`/admin/users/${user.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TextInput
            label="Full Name"
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter full name"
            required
            fullWidth
          />

          <TextInput
            label="Email"
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
            fullWidth
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Manager', value: 'manager' },
              { label: 'Client', value: 'client' },
            ]}
            fullWidth
          />

          <Select
            label="Status"
            value={formData.is_active ? 'active' : 'disabled'}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.value === 'active' })
            }
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Disabled', value: 'disabled' },
            ]}
            fullWidth
          />

          <Select
            label="Client"
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            placeholder="— No Client —"
            options={clients.map((client) => ({
              label: client.name,
              value: client.id,
            }))}
            fullWidth
          />

          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--_color---surface--negative)',
                border: '1px solid var(--_color---border--negative)',
                borderRadius: 'var(--_layout---border-radius--md, 8px)',
                color: 'var(--_color---text--negative)',
                fontSize: 'var(--_typography---body--sm, 14px)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/admin/users/${user.id}`)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
