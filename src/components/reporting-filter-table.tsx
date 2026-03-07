'use client';

import { useState, useMemo } from 'react';
import { FilterButton } from '@bds/components/ui/FilterButton/FilterButton';
import { Button } from '@bds/components/ui/Button/Button';
import { font, color, space, gap } from '@/lib/tokens';
import { formatIndustry, formatReportSetType } from '@/lib/format';
import { DataTable } from './data-table';
import { ReportSetStatusBadge, ScoreTierBadge } from './report-badges';

export interface ReportSetRow {
  id: string;
  type?: string;
  status: string;
  overall_score: number | null;
  overall_max_score: number | null;
  overall_tier: string | null;
  created_at: string;
  companies: { id: string; name: string; slug: string; industry: string | null } | null;
  reports: Array<{ status: string }> | null;
}

const typeOptions = [
  { label: 'Marketing Analysis', value: 'marketing_analysis' },
];

export function ReportingFilterTable({ reportSets }: { reportSets: ReportSetRow[] }) {
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const rs of reportSets) {
      const c = rs.companies;
      if (c && !seen.has(c.id)) seen.set(c.id, c.name);
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, label: name }));
  }, [reportSets]);

  const industryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(reportSets.map((rs) => (rs.companies as ReportSetRow['companies'])?.industry).filter(Boolean) as string[])
    );
    unique.sort((a, b) => a.localeCompare(b));
    return unique.map((i) => ({ id: i, label: formatIndustry(i) }));
  }, [reportSets]);

  const filtered = useMemo(() => {
    return reportSets.filter((rs) => {
      if (clientFilter && rs.companies?.id !== clientFilter) return false;
      if (industryFilter && rs.companies?.industry !== industryFilter) return false;
      if (typeFilter && rs.type !== typeFilter) return false;
      return true;
    });
  }, [reportSets, clientFilter, industryFilter, typeFilter]);

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
          Showing {filtered.length} of {reportSets.length}
        </span>

        <div style={{ display: 'flex', gap: gap.xs, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterButton
            label="Client"
            value={clientFilter}
            onChange={setClientFilter}
            options={clientOptions}
          />
          <FilterButton
            label="Industry"
            value={industryFilter}
            onChange={setIndustryFilter}
            options={industryOptions}
          />
          <FilterButton
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions.map((o) => ({ id: o.value, label: o.label }))}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        rowKey={(rs) => rs.id}
        emptyMessage="No analyses match your filters."
        columns={[
          {
            header: 'Client',
            accessor: (rs) => {
              const client = rs.companies;
              return client ? (
                <a
                  href={`/admin/companies/${client.slug}`}
                  style={{ color: color.text.primary, textDecoration: 'none', fontWeight: font.weight.medium }}
                >
                  {client.name}
                </a>
              ) : '—';
            },
          },
          {
            header: 'Type',
            accessor: (rs) => formatReportSetType(rs.type ?? 'marketing_analysis'),
            style: { color: color.text.secondary },
          },
          {
            header: 'Status',
            accessor: (rs) => <ReportSetStatusBadge status={rs.status} />,
          },
          {
            header: 'Industry',
            accessor: (rs) => formatIndustry(rs.companies?.industry ?? null),
            style: { color: color.text.secondary },
          },
          {
            header: 'Progress',
            accessor: (rs) => {
              const reports = rs.reports;
              if (!reports || reports.length === 0) return '—';
              const done = reports.filter((r) => r.status === 'completed').length;
              return `${done} / ${reports.length} complete`;
            },
            style: { color: color.text.secondary },
          },
          {
            header: 'Tier',
            accessor: (rs) =>
              rs.status === 'completed' && rs.overall_tier
                ? <ScoreTierBadge tier={rs.overall_tier} />
                : '—',
          },
          {
            header: 'Created',
            accessor: (rs) => new Date(rs.created_at).toLocaleDateString(),
            style: { color: color.text.secondary },
          },
          {
            header: '',
            accessor: (rs) => {
              const client = rs.companies;
              return client ? (
                <Button variant="secondary" size="sm" asLink href={`/admin/reporting/${client.slug}`}>
                  View
                </Button>
              ) : null;
            },
            style: { textAlign: 'right' },
          },
        ]}
      />
    </div>
  );
}
