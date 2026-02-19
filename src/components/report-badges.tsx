import type { ReactNode } from 'react';
import { Badge, type BadgeStatus } from '@bds/components/ui/Badge/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faRotate,
  faTriangleExclamation,
  faCircleXmark,
  faPencil,
} from '@fortawesome/free-solid-svg-icons';

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

// ── Report Set Status ──────────────────────────────────────────────

const reportSetStatusMap: Record<string, StatusConfig> = {
  in_progress: {
    label: 'In Progress',
    variant: 'progress',
    icon: <FontAwesomeIcon icon={faRotate} style={iconSize} />,
  },
  completed: {
    label: 'Completed',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  needs_review: {
    label: 'Needs Review',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
};

// ── Report Status ──────────────────────────────────────────────────

const reportStatusMap: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    variant: 'neutral',
    icon: <FontAwesomeIcon icon={faPencil} style={iconSize} />,
  },
  in_progress: {
    label: 'In Progress',
    variant: 'progress',
    icon: <FontAwesomeIcon icon={faRotate} style={iconSize} />,
  },
  completed: {
    label: 'Completed',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  needs_review: {
    label: 'Needs Review',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
};

// ── Score Tier ─────────────────────────────────────────────────────

const tierMap: Record<string, StatusConfig> = {
  pass: {
    label: 'Pass',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  fair: {
    label: 'Fair',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
  fail: {
    label: 'Fail',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
};

// ── Item Status ────────────────────────────────────────────────────

const itemStatusMap: Record<string, StatusConfig> = {
  pass: {
    label: 'Pass',
    variant: 'positive',
    icon: <FontAwesomeIcon icon={faCircleCheck} style={iconSize} />,
  },
  warning: {
    label: 'Warning',
    variant: 'warning',
    icon: <FontAwesomeIcon icon={faTriangleExclamation} style={iconSize} />,
  },
  error: {
    label: 'Error',
    variant: 'error',
    icon: <FontAwesomeIcon icon={faCircleXmark} style={iconSize} />,
  },
  neutral: {
    label: 'Pending',
    variant: 'neutral',
  },
};

// ── Exports ────────────────────────────────────────────────────────

export function ReportSetStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={reportSetStatusMap} />;
}

export function ReportStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={reportStatusMap} />;
}

export function ScoreTierBadge({ tier }: { tier: string }) {
  return <StatusBadgeBase status={tier} map={tierMap} />;
}

export function ItemStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase status={status} map={itemStatusMap} />;
}
