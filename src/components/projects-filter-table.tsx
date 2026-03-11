'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { ProjectStatusBadge } from './status-badges';
import { ServiceBadge } from './service-badge';

interface ServiceInfo {
  id: string;
  name: string;
  category_slug: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  company: { id: string; name: string; slug: string } | null;
  services: ServiceInfo[];
}

interface FilterOption {
  label: string;
  value: string;
}

export function ProjectsFilterTable({
  projects,
  clientOptions,
}: {
  projects: ProjectRow[];
  clientOptions: FilterOption[];
}) {
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (clientFilter && p.company?.id !== clientFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, clientFilter, statusFilter]);

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
          Showing {filtered.length} of {projects.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterButton
            size="sm"
            label="Client"
            value={clientFilter}
            onChange={setClientFilter}
            options={clientOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
          <FilterButton
            size="sm"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: 'not_started', label: 'Not Started' },
              { id: 'active', label: 'In Progress' },
              { id: 'completed', label: 'Complete' },
              { id: 'on_hold', label: 'On Hold' },
              { id: 'cancelled', label: 'Canceled' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        rowKey={(p) => p.id}
        emptyMessage="No projects match your filters."
        columns={[
          {
            header: 'Services',
            accessor: (p) =>
              p.services.length > 0 ? (
                <div style={{ display: 'flex', gap: gap.xs }}>
                  {p.services.map((s) => (
                    <ServiceBadge
                      key={s.id}
                      category={s.category_slug}
                      serviceName={s.name}
                      size={28}
                    />
                  ))}
                </div>
              ) : (
                <span style={{ color: color.text.muted }}>—</span>
              ),
            style: { width: '120px' },
          },
          {
            header: 'Project',
            accessor: (p) => (
              <a
                href={`/admin/projects/${p.slug}`}
                className="cell-link"
                style={{ fontWeight: font.weight.medium }}
              >
                {p.name}
              </a>
            ),
          },
          {
            header: 'Client',
            accessor: (p) =>
              p.company ? (
                <a
                  href={`/admin/companies/${p.company.slug}`}
                  className="cell-link"
                >
                  {p.company.name}
                </a>
              ) : (
                '—'
              ),
          },
          {
            header: 'Status',
            accessor: (p) => <ProjectStatusBadge status={p.status} />,
          },
          {
            header: 'Start',
            accessor: (p) => p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
            style: { color: color.text.secondary },
          },
          {
            header: 'End',
            accessor: (p) => p.end_date ? new Date(p.end_date).toLocaleDateString() : '—',
            style: { color: color.text.secondary },
          },
          {
            header: '',
            accessor: (p) => (
              <div style={{ display: 'flex', gap: gap.xs, justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" asLink href={`/admin/projects/${p.slug}/edit`}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" asLink href={`/admin/projects/${p.slug}`}>
                  View
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
