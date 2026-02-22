import { formatCurrency } from '@/lib/format';

export interface MergeData {
  client: {
    name: string;
    address: string | null;
    contact_name: string | null;
    contact_email: string | null;
    phone: string | null;
  };
  proposal: {
    title: string;
    total_amount_cents: number;
    items: {
      name: string;
      description: string | null;
      quantity: number;
      unit_price_cents: number;
      service_type?: string | null;
      billing_frequency?: string | null;
    }[];
  };
  effectiveDate: string;
}

function buildServicesTable(items: MergeData['proposal']['items']): string {
  const rows = items.map((item) => {
    const subtotal = item.quantity * item.unit_price_cents;
    const freq = item.billing_frequency === 'monthly' ? '/mo' : '';
    return `| ${item.name} | ${item.description || '—'} | ${item.quantity} | ${formatCurrency(item.unit_price_cents)}${freq} | ${formatCurrency(subtotal)}${freq} |`;
  });

  const monthlyItems = items.filter((i) => i.billing_frequency === 'monthly');
  const onetimeItems = items.filter((i) => i.billing_frequency !== 'monthly');

  const monthlyTotal = monthlyItems.reduce((sum, i) => sum + i.quantity * i.unit_price_cents, 0);
  const onetimeTotal = onetimeItems.reduce((sum, i) => sum + i.quantity * i.unit_price_cents, 0);

  let table = '| Service | Description | Qty | Unit Price | Subtotal |\n';
  table += '|---------|-------------|-----|------------|----------|\n';
  table += rows.join('\n');

  if (monthlyTotal > 0) {
    table += `\n\n**Monthly Total:** ${formatCurrency(monthlyTotal)}/mo`;
  }
  if (onetimeTotal > 0) {
    table += `\n\n**One-Time Total:** ${formatCurrency(onetimeTotal)}`;
  }

  return table;
}

export function mergeTemplate(templateContent: string, data: MergeData): string {
  const { client, proposal, effectiveDate } = data;

  const monthlyItems = proposal.items.filter((i) => i.billing_frequency === 'monthly');
  const onetimeItems = proposal.items.filter((i) => i.billing_frequency !== 'monthly');
  const monthlyTotal = monthlyItems.reduce((sum, i) => sum + i.quantity * i.unit_price_cents, 0);
  const onetimeTotal = onetimeItems.reduce((sum, i) => sum + i.quantity * i.unit_price_cents, 0);

  const replacements: Record<string, string> = {
    '{{client_name}}': client.name || '',
    '{{client_address}}': client.address || 'Address on file',
    '{{client_contact_name}}': client.contact_name || '',
    '{{client_contact_email}}': client.contact_email || '',
    '{{client_phone}}': client.phone || '',
    '{{effective_date}}': effectiveDate,
    '{{services_table}}': buildServicesTable(proposal.items),
    '{{monthly_total}}': formatCurrency(monthlyTotal) + '/mo',
    '{{onetime_total}}': formatCurrency(onetimeTotal),
    '{{total_amount}}': formatCurrency(proposal.total_amount_cents),
    '{{company_name}}': 'Brik Designs LLC',
  };

  let merged = templateContent;
  for (const [tag, value] of Object.entries(replacements)) {
    merged = merged.replaceAll(tag, value);
  }

  return merged;
}
