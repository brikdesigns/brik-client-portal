'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap, border } from '@/lib/tokens';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
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
            placeholder="Select role"
            options={[
              { label: 'Brik Admin', value: 'super_admin' },
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
                padding: `${space.sm} ${space.md}`,
                backgroundColor: color.surface.negative,
                border: `${border.width.sm} solid ${color.border.negative}`,
                borderRadius: border.radius.md,
                color: color.text.negative,
                fontSize: font.size.body.sm,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: gap.sm, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
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
    </form>
  );
}
