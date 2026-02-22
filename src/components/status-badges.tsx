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
  faStop,
  faClipboardList,
  faUser,
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

// ── Company Status (unified) ────────────────────────────────────────
const companyStatusMap: Record<string, StatusConfig> = {
  not_started: {
    label: 'Not Started',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faStop} style={iconSize} />,
  },
  needs_qualified: {
    label: 'Needs Qualified',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
  needs_proposal: {
    label: 'Needs Proposal',
    variant: 'info',
    icon: <FontAwesomeIcon icon={faClipboardList} style={iconSize} />,
  },
  active: {
    label: 'Active',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  not_active: {
    label: 'Not Active',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faCircleRegular} style={iconSize} />,
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

// ── Agreement Status ────────────────────────────────────────────────
const agreementStatusMap: Record<string, StatusConfig> = {
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
  signed: {
    label: 'Signed',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  expired: {
    label: 'Expired',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faClock} style={iconSize} />,
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

const companyTypeLabels: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  client: 'Client',
};

// Company type tag colors (system palette)
const companyTypeColors: Record<string, { bg: string; text: string }> = {
  lead:     { bg: '#8b5cf6', text: '#ffffff' },  // purple
  prospect: { bg: '#4665f5', text: '#ffffff' },  // blue
  client:   { bg: '#27ae60', text: '#ffffff' },  // green
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  client: 'Client',
  manager: 'Manager',
};

// ── Exported Components ─────────────────────────────────────────────

export function CompanyStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={companyStatusMap} />;
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

export function AgreementStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={agreementStatusMap} />;
}

export function ProposalStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={proposalStatusMap} />;
}

export function CompanyTypeTag({ type, muted = false }: { type: string; muted?: boolean }) {
  const colors = muted
    ? { bg: 'var(--_color---bg--secondary, #e0e0e0)', text: 'var(--_color---text--secondary, #828282)' }
    : companyTypeColors[type] ?? { bg: '#e0e0e0', text: '#333' };
  return (
    <Tag
      icon={<FontAwesomeIcon icon={faUser} style={{ width: 10, height: 10 }} />}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {companyTypeLabels[type] ?? type}
    </Tag>
  );
}

/** @deprecated Use CompanyTypeTag */
export const CompanyTypeBadge = CompanyTypeTag;

export function ServiceTypeTag({ type }: { type: string }) {
  return <Tag>{serviceTypeLabels[type] ?? type}</Tag>;
}

export function RoleTag({ role }: { role: string }) {
  return <Tag>{roleLabels[role] ?? role}</Tag>;
}

