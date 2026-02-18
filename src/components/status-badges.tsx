import type { ReactNode } from 'react';
import { Badge, type BadgeStatus } from '@bds/components/ui/Badge/Badge';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faRotate,
  faTriangleExclamation,
  faCircleXmark,
  faPencil,
  faEye,
  faPaperPlane,
  faClock,
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
  prospect: {
    label: 'Prospect',
    variant: 'info',
    icon: <FontAwesomeIcon icon={faCircleRegular} style={iconSize} />,
  },
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

// ── Proposal Status ─────────────────────────────────────────────────
const proposalStatusMap: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faPencil} style={iconSize} />,
  },
  sent: {
    label: 'Sent',
    variant: 'info',
    icon: <FontAwesomeIcon icon={faPaperPlane} style={iconSize} />,
  },
  viewed: {
    label: 'Viewed',
    variant: 'progress',
    icon: <FontAwesomeIcon icon={faEye} style={iconSize} />,
  },
  accepted: {
    label: 'Accepted',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  declined: {
    label: 'Declined',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
  expired: {
    label: 'Expired',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faClock} style={iconSize} />,
  },
};

// ── Tags (nouns: types, classifications, roles) ────────────────────

const serviceTypeLabels: Record<string, string> = {
  one_time: 'One-time',
  recurring: 'Recurring',
  add_on: 'Add-on',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  client: 'Client',
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

export function ProposalStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={proposalStatusMap} />;
}

export function ServiceTypeTag({ type }: { type: string }) {
  return <Tag>{serviceTypeLabels[type] ?? type}</Tag>;
}

export function RoleTag({ role }: { role: string }) {
  return <Tag>{roleLabels[role] ?? role}</Tag>;
}

/** @deprecated Use ServiceTypeTag instead */
export const ServiceTypeBadge = ServiceTypeTag;
