'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { PageHeader, type MetadataItem } from '@/components/page-header';
import { font, color, gap, space } from '@/lib/tokens';
import { formatContactRole } from '@/lib/format';
import { DataTable } from './data-table';

export interface ContactRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string;
  is_primary: boolean;
  user_id: string | null;
  companies: { name: string; slug: string } | null;
}

function getUserType(c: ContactRow): string {
  return c.user_id ? 'Portal User' : 'Contact Only';
}

function getUserStatus(c: ContactRow): string {
  return c.is_primary ? 'Primary' : 'Standard';
}

export function ContactsPageContent({ contacts }: { contacts: ContactRow[] }) {
  const [userTypeFilter, setUserTypeFilter] = useState<string | undefined>();
  const [userStatusFilter, setUserStatusFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [companyFilter, setCompanyFilter] = useState<string | undefined>();

  const userTypeOptions = [
    { id: 'Portal User', label: 'Portal User' },
    { id: 'Contact Only', label: 'Contact Only' },
  ];

  const userStatusOptions = [
    { id: 'Primary', label: 'Primary' },
    { id: 'Standard', label: 'Standard' },
  ];

  const roleOptions = useMemo(() => {
    const unique = Array.from(new Set(contacts.map((c) => c.role)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((r) => ({ id: r, label: formatContactRole(r) }));
  }, [contacts]);

  const companyOptions = useMemo(() => {
    const unique = Array.from(
      new Set(contacts.map((c) => c.companies?.name).filter(Boolean) as string[])
    );
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((name) => ({ id: name, label: name }));
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (userTypeFilter && getUserType(c) !== userTypeFilter) return false;
      if (userStatusFilter && getUserStatus(c) !== userStatusFilter) return false;
      if (roleFilter && c.role !== roleFilter) return false;
      if (companyFilter && c.companies?.name !== companyFilter) return false;
      return true;
    });
  }, [contacts, userTypeFilter, userStatusFilter, roleFilter, companyFilter]);

  const metadata: MetadataItem[] = [
    {
      label: 'User Type',
      value: (
        <FilterButton
          size="sm"
          label="All"
          value={userTypeFilter}
          onChange={setUserTypeFilter}
          options={userTypeOptions}
        />
      ),
    },
    {
      label: 'User Status',
      value: (
        <FilterButton
          size="sm"
          label="All"
          value={userStatusFilter}
          onChange={setUserStatusFilter}
          options={userStatusOptions}
        />
      ),
    },
    {
      label: 'Role',
      value: (
        <FilterButton
          size="sm"
          label="All"
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
        />
      ),
    },
    {
      label: 'Company',
      value: (
        <FilterButton
          size="sm"
          label="All"
          value={companyFilter}
          onChange={setCompanyFilter}
          options={companyOptions}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People at your companies — clients, managers, and admins."
        actions={
          <Button variant="primary" size="sm" asLink href="/admin/contacts/new">
            Add Contact
          </Button>
        }
        metadata={metadata}
      />

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: gap.sm,
          marginBottom: space.md,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.sm,
            color: color.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Showing {filtered.length} of {contacts.length}
        </span>
      </div>

      <DataTable
        data={filtered}
        rowKey={(c) => c.id}
        emptyMessage="No contacts match your filters"
        emptyDescription="Try adjusting your filters or add a new contact."
        emptyAction={{ label: 'Add Contact', href: '/admin/contacts/new' }}
        columns={[
          {
            header: 'Name',
            accessor: (c) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: gap.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                {c.full_name}
                {c.is_primary && (
                  <Tag size="sm" style={{ color: color.text.muted }}>Primary</Tag>
                )}
              </span>
            ),
          },
          {
            header: 'Company',
            accessor: (c) => {
              return c.companies ? (
                <a
                  href={`/admin/companies/${c.companies.slug}`}
                  className="cell-link"
                >
                  {c.companies.name}
                </a>
              ) : '—';
            },
          },
          {
            header: 'Job Title',
            accessor: (c) => c.title || '—',
            style: { color: color.text.secondary, minWidth: '120px' },
          },
          {
            header: 'Email',
            accessor: (c) => c.email || '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'Role',
            accessor: (c) => (
              <Tag size="sm" style={{ color: color.text.muted }}>
                {formatContactRole(c.role)}
              </Tag>
            ),
          },
          {
            header: '',
            accessor: (c) => (
              <div style={{ display: 'flex', gap: gap.sm, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${c.id}`}>
                  View
                </Button>
                <Button variant="primary" size="sm" asLink href={`/admin/contacts/${c.id}/edit`}>
                  Edit
                </Button>
              </div>
            ),
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
