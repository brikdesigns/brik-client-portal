import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/page-header';
import { EditInvoiceForm } from '@/components/edit-invoice-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      id, client_id, description, amount_cents, status,
      invoice_date, due_date, paid_at, invoice_url,
      clients(name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const client = invoice.clients as unknown as { name: string; slug: string } | null;

  return (
    <div>
      <PageHeader
        title="Edit invoice"
        subtitle={invoice.description || 'Invoice'}
      />
      <EditInvoiceForm
        invoice={{
          id: invoice.id,
          client_id: invoice.client_id,
          description: invoice.description,
          amount_cents: invoice.amount_cents,
          status: invoice.status,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          paid_at: invoice.paid_at,
          invoice_url: invoice.invoice_url,
        }}
        clientName={client?.name ?? 'Unknown'}
        clientSlug={client?.slug}
      />
    </div>
  );
}
