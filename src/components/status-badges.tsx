import type { ReactNode } from 'react';
import { Badge, type BadgeStatus } from '@bds/components/ui/Badge/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircle,
  faRotate,
  faTriangleExclamation,
  faCircleXmark,
  faPencil,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { faCircle as faCircleRegular } from '@fortawesome/free-regular-svg-icons';

const iconSize = { width: 12, height: 12 };

interface StatusConfig {
  label: string;
  variant: BadgeStatus;
  icon?: ReactNode;
}

function StatusBadgeBase({ status, map }: { status: string; map: Record<string, StatusConfig> }) {
  const config = map[status] ?? { label: status, variant: 'neutral' as const };
  return (
    <Badge status={config.variant} icon={config.icon}>
      {config.label}
    </Badge>
  );
}

// ── Client / User Status ────────────────────────────────────────────
const clientStatusMap: Record<string, StatusConfig> = {
  active: {
    label: 'Active',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  inactive: {
    label: 'Inactive',
    variant: 'neutral',
  },
  archived: {
    label: 'Archived',
    variant: 'neutral',
  },
};

// ── Service Status ──────────────────────────────────────────────────
const serviceStatusMap: Record<string, StatusConfig> = {
  active: {
    label: 'Active',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  paused: {
    label: 'Inactive',
    variant: 'neutral',
  },
  cancelled: {
    label: 'Canceled',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
  completed: {
    label: 'Complete',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
};

// ── Project Status ──────────────────────────────────────────────────
const projectStatusMap: Record<string, StatusConfig> = {
  not_started: {
    label: 'Not Started',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faCircleRegular} style={iconSize} />,
  },
  active: {
    label: 'In Progress',
    variant: 'progress',
    icon: <FontAwesomeIcon icon={faRotate} style={iconSize} />,
  },
  completed: {
    label: 'Complete',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  on_hold: {
    label: 'Needs Attention',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
  cancelled: {
    label: 'Canceled',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
};

// ── Invoice / Billing Status ────────────────────────────────────────
const invoiceStatusMap: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faPencil} style={iconSize} />,
  },
  open: {
    label: 'Open',
    variant: 'info',
    icon: <FontAwesomeIcon icon={faEye} style={iconSize} />,
  },
  paid: {
    label: 'Paid',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  void: {
    label: 'Needs Attention',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
  uncollectible: {
    label: 'Not Paid',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
};

// ── Service Type ────────────────────────────────────────────────────
const serviceTypeMap: Record<string, StatusConfig> = {
  one_time: { label: 'One-time', variant: 'neutral' },
  recurring: {
    label: 'Recurring',
    variant: 'info',
    icon: <FontAwesomeIcon icon={faRotate} style={iconSize} />,
  },
  add_on: {
    label: 'Add-on',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faCircle} style={iconSize} />,
  },
};

// ── Exported Components ─────────────────────────────────────────────

export function ClientStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={clientStatusMap} />;
}

export function ServiceStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={serviceStatusMap} />;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={projectStatusMap} />;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={invoiceStatusMap} />;
}

export function ServiceTypeBadge({ type }: { type: string }) {
  return <StatusBadgeBase status={type} map={serviceTypeMap} />;
}
