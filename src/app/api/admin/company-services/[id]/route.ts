import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';

/**
 * DELETE /api/admin/company-services/[id]
 * Remove a service from a prospect/lead — deletes the record and updates any active proposal.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (isAuthError(auth)) return auth;

  // Fetch the assignment + company type
  const { data: assignment, error: fetchErr } = await supabase
    .from('company_services')
    .select('id, company_id, service_id, proposal_id, companies(type)')
    .eq('id', id)
    .single();

  if (fetchErr || !assignment) {
    return NextResponse.json({ error: 'Service assignment not found' }, { status: 404 });
  }

  const companyType = (assignment as unknown as { companies: { type: string } }).companies?.type;

  // Only allow DELETE for prospects/leads — clients should use PATCH to deactivate
  if (companyType === 'client') {
    return NextResponse.json(
      { error: 'Cannot delete service from a client. Use PATCH to deactivate instead.' },
      { status: 400 },
    );
  }

  // Remove matching proposal_items from latest active proposal
  const { data: latestProposal } = await supabase
    .from('proposals')
    .select('id, total_amount_cents')
    .eq('company_id', assignment.company_id)
    .in('status', ['draft', 'sent', 'viewed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestProposal) {
    // Get the item's price before deleting so we can recalculate the total
    const { data: removedItems } = await supabase
      .from('proposal_items')
      .select('id, unit_price_cents, quantity')
      .eq('proposal_id', latestProposal.id)
      .eq('service_id', assignment.service_id);

    const removedTotal = (removedItems ?? []).reduce(
      (sum, item) => sum + item.unit_price_cents * (item.quantity ?? 1),
      0,
    );

    // Delete the proposal items
    await supabase
      .from('proposal_items')
      .delete()
      .eq('proposal_id', latestProposal.id)
      .eq('service_id', assignment.service_id);

    // Recalculate proposal total
    if (removedTotal > 0) {
      const newTotal = Math.max(0, (latestProposal.total_amount_cents ?? 0) - removedTotal);
      await supabase
        .from('proposals')
        .update({ total_amount_cents: newTotal })
        .eq('id', latestProposal.id);
    }
  }

  // Delete the company_service record (cascades to service_tasks)
  const { error: deleteErr } = await supabase
    .from('company_services')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposal_updated: !!latestProposal });
}

/**
 * PATCH /api/admin/company-services/[id]
 * Deactivate a service for a client — sets status to cancelled.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { status } = body;

  if (status !== 'cancelled') {
    return NextResponse.json({ error: 'Only "cancelled" status is supported' }, { status: 400 });
  }

  const { error } = await supabase
    .from('company_services')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
