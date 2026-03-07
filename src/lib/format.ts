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
