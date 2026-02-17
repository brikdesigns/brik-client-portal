'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@bds/components/ui/Card/Card';
import { Input } from '@bds/components/ui/Input/Input';
import { Button } from '@bds/components/ui/Button/Button';

interface EditUserFormProps {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    is_active: boolean;
  };
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email,
    role: user.role,
    is_active: user.is_active,
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

  const labelStyle = {
    fontFamily: 'var(--_typography---font-family--label)',
    fontSize: 'var(--_typography---body--sm, 14px)',
    fontWeight: 500,
    color: 'var(--_color---text--primary)',
    marginBottom: '8px',
    display: 'block',
  };

  const selectStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: 'var(--_typography---body--md, 16px)',
    padding: '12px 16px',
    border: '1px solid var(--_color---border--default)',
    borderRadius: 'var(--_layout---border-radius--md, 8px)',
    backgroundColor: 'var(--_color---surface--raised)',
    color: 'var(--_color---text--primary)',
    width: '100%',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" style={labelStyle}>
              Full Name
            </label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" style={labelStyle}>
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={selectStyle}
            >
              <option value="admin">Admin</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="is_active" style={labelStyle}>
              Status
            </label>
            <select
              id="is_active"
              value={formData.is_active ? 'active' : 'disabled'}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.value === 'active' })
              }
              style={selectStyle}
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          {/* Error Message */}
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

          {/* Actions */}
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
