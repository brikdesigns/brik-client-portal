import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthError } from '@/lib/auth';

/**
 * DELETE /api/admin/proposal-items/[id]
 * Remove a service line item from a proposal and recalculate the total.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (isAuthError(auth)) return auth;

  // Fetch the item to get its value and parent proposal
  const { data: item, error: fetchErr } = await supabase
    .from('proposal_items')
    .select('id, proposal_id, unit_price_cents, quantity')
    .eq('id', id)
    .single();

  if (fetchErr || !item) {
    return NextResponse.json({ error: 'Proposal item not found' }, { status: 404 });
  }

  // Verify the proposal is still in a mutable state
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, status, total_amount_cents')
    .eq('id', item.proposal_id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (!['draft', 'sent', 'viewed'].includes(proposal.status)) {
    return NextResponse.json(
      { error: 'Cannot modify a signed or expired proposal' },
      { status: 400 },
    );
  }

  // Delete the item
  const { error: deleteErr } = await supabase
    .from('proposal_items')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // Recalculate proposal total
  const removedAmount = item.unit_price_cents * (item.quantity ?? 1);
  if (removedAmount > 0) {
    const newTotal = Math.max(0, (proposal.total_amount_cents ?? 0) - removedAmount);
    await supabase
      .from('proposals')
      .update({ total_amount_cents: newTotal })
      .eq('id', proposal.id);
  }

  return NextResponse.json({ success: true });
}
