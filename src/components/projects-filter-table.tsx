'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';
import { DataTable } from './data-table';
import { ProjectStatusBadge } from './status-badges';
import { ServiceBadge, ServiceCategoryLabel, categoryConfig } from './service-badge';

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

/** Flattened row: one row per service (or one row with no service for unassigned projects) */
interface FlatRow {
  /** Unique key for DataTable — combines project + service */
  key: string;
  project: ProjectRow;
  service: ServiceInfo | null;
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
  const [serviceLineFilter, setServiceLineFilter] = useState<string | undefined>();

  const serviceLineOptions = useMemo(() => {
    const slugs = new Set<string>();
    projects.forEach((p) => p.services.forEach((s) => slugs.add(s.category_slug)));
    return Array.from(slugs)
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => ({ id: slug, label: (categoryConfig as Record<string, { label: string }>)[slug]?.label ?? slug }));
  }, [projects]);

  /** Flatten: one row per service, or one row with null service for unassigned projects */
  const flatRows = useMemo(() => {
    const rows: FlatRow[] = [];
    for (const p of projects) {
      if (p.services.length === 0) {
        rows.push({ key: p.id, project: p, service: null });
      } else {
        for (const s of p.services) {
          rows.push({ key: `${p.id}-${s.id}`, project: p, service: s });
        }
      }
    }
    return rows;
  }, [projects]);

  const filtered = useMemo(() => {
    return flatRows.filter((r) => {
      if (clientFilter && r.project.company?.id !== clientFilter) return false;
      if (statusFilter && r.project.status !== statusFilter) return false;
      if (serviceLineFilter && r.service?.category_slug !== serviceLineFilter) return false;
      return true;
    });
  }, [flatRows, clientFilter, statusFilter, serviceLineFilter]);

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
          Showing {filtered.length} of {flatRows.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterButton
            size="sm"
            label="Service Line"
            value={serviceLineFilter}
            onChange={setServiceLineFilter}
            options={serviceLineOptions}
          />
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
        rowKey={(r) => r.key}
        emptyMessage="No projects match your filters"
        emptyDescription="Try adjusting your filters or add a new project."
        emptyAction={{ label: 'Add Project', href: '/admin/projects/new' }}
        columns={[
          {
            header: '',
            accessor: (r) =>
              r.service ? (
                <ServiceBadge
                  category={r.service.category_slug}
                  serviceName={r.service.name}
                  size={28}
                />
              ) : (
                <span style={{ color: color.text.muted }}>—</span>
              ),
            style: { width: '44px' },
          },
          {
            header: 'Service',
            accessor: (r) =>
              r.service ? (
                <span>{r.service.name}</span>
              ) : (
                <span style={{ color: color.text.muted }}>—</span>
              ),
          },
          {
            header: 'Service Line',
            accessor: (r) =>
              r.service ? (
                <ServiceCategoryLabel category={r.service.category_slug} />
              ) : (
                <span style={{ color: color.text.muted }}>—</span>
              ),
          },
          {
            header: 'Project',
            accessor: (r) => (
              <a
                href={`/admin/projects/${r.project.slug}`}
                className="cell-link"
                style={{ fontWeight: font.weight.medium }}
              >
                {r.project.name}
              </a>
            ),
          },
          {
            header: 'Client',
            accessor: (r) =>
              r.project.company ? (
                <a
                  href={`/admin/companies/${r.project.company.slug}`}
                  className="cell-link"
                >
                  {r.project.company.name}
                </a>
              ) : (
                '—'
              ),
          },
          {
            header: 'Status',
            accessor: (r) => <ProjectStatusBadge status={r.project.status} />,
          },
          {
            header: '',
            accessor: (r) => (
              <div style={{ display: 'flex', gap: gap.xs, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" asLink href={`/admin/projects/${r.project.slug}/edit`}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" asLink href={`/admin/projects/${r.project.slug}`}>
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
