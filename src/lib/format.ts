export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

const REPORT_SET_TYPE_LABELS: Record<string, string> = {
  marketing_analysis: 'Marketing Analysis',
};

export function formatReportSetType(type: string | null): string {
  if (!type) return '—';
  return REPORT_SET_TYPE_LABELS[type] ?? type.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatIndustry(industry: string | null): string {
  if (!industry) return '—';
  return industry
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a US phone number as (XXX) XXX-XXXX.
 * Accepts any string — strips non-digits, caps at 10 digits.
 */
/**
 * Format a contact role for display.
 * Handles underscored values like 'team_member' → 'Team Member'.
 */
const CONTACT_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  team_member: 'Team Member',
};

export function formatContactRole(role: string): string {
  return CONTACT_ROLE_LABELS[role] ?? role.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d})`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
