'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { font, color, space, gap } from '@/lib/tokens';
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

export function ContactsFilterTable({ contacts }: { contacts: ContactRow[] }) {
  const [companyFilter, setCompanyFilter] = useState<string | undefined>();
  const [titleFilter, setTitleFilter] = useState<string | undefined>();

  const companyOptions = useMemo(() => {
    const unique = Array.from(
      new Set(contacts.map((c) => c.companies?.name).filter(Boolean) as string[])
    );
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((name) => ({ id: name, label: name }));
  }, [contacts]);

  const titleOptions = useMemo(() => {
    const unique = Array.from(
      new Set(contacts.map((c) => c.title).filter(Boolean) as string[])
    );
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((t) => ({ id: t, label: t }));
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (companyFilter && c.companies?.name !== companyFilter) return false;
      if (titleFilter && c.title !== titleFilter) return false;
      return true;
    });
  }, [contacts, companyFilter, titleFilter]);

  return (
    <div>
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

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterButton
            size="sm"
            label="Company"
            value={companyFilter}
            onChange={setCompanyFilter}
            options={companyOptions}
          />
          <FilterButton
            size="sm"
            label="Job Title"
            value={titleFilter}
            onChange={setTitleFilter}
            options={titleOptions}
          />
        </div>
      </div>

      {/* Table */}
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
