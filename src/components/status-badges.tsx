import { Badge } from '@bds/components/ui/Badge/Badge';

type BadgeVariant = 'positive' | 'warning' | 'info' | 'error' | 'default';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

function StatusBadgeBase({ status, map }: { status: string; map: Record<string, StatusConfig> }) {
  const config = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge status={config.variant}>{config.label}</Badge>;
}

const projectStatusMap: Record<string, StatusConfig> = {
  active: { label: 'Active', variant: 'positive' },
  completed: { label: 'Completed', variant: 'info' },
  on_hold: { label: 'On hold', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

const clientStatusMap: Record<string, StatusConfig> = {
  active: { label: 'Active', variant: 'positive' },
  inactive: { label: 'Inactive', variant: 'warning' },
  archived: { label: 'Archived', variant: 'default' },
};

const invoiceStatusMap: Record<string, StatusConfig> = {
  paid: { label: 'Paid', variant: 'positive' },
  open: { label: 'Open', variant: 'warning' },
  draft: { label: 'Draft', variant: 'default' },
  void: { label: 'Void', variant: 'default' },
  uncollectible: { label: 'Uncollectible', variant: 'error' },
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={projectStatusMap} />;
}

export function ClientStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={clientStatusMap} />;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={invoiceStatusMap} />;
}
