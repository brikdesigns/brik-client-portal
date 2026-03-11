import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Check if a company is ready to be promoted to client/active.
 *
 * Promotion requires:
 * 1. At least one proposal is signed
 * 2. ALL agreements for the company are signed (marketing agreement, BAA, etc.)
 *
 * If both conditions are met AND the company is not already a client,
 * updates company.type = 'client' and company.status = 'active'.
 *
 * Returns true if promotion happened, false otherwise.
 */
export async function tryPromoteCompany(companyId: string): Promise<boolean> {
  const supabase = getServiceClient();

  // Check company current state — skip if already a client
  const { data: company } = await supabase
    .from('companies')
    .select('type')
    .eq('id', companyId)
    .single();

  if (!company || company.type === 'client') {
    return false;
  }

  // Check for at least one signed proposal
  const { count: signedProposals } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'signed');

  if (!signedProposals || signedProposals === 0) {
    return false;
  }

  // Check ALL agreements — every one must be signed
  const { data: agreements } = await supabase
    .from('agreements')
    .select('id, status')
    .eq('company_id', companyId);

  if (!agreements || agreements.length === 0) {
    // No agreements at all — promotion still ok (non-healthcare client
    // might have agreements generated after this check, so only promote
    // if agreements exist and are all signed, OR if none exist)
    // Actually: agreements are always generated (marketing_agreement at minimum).
    // If none exist yet, we're being called before generation — don't promote.
    return false;
  }

  const allSigned = agreements.every((a) => a.status === 'signed');
  if (!allSigned) {
    return false;
  }

  // All conditions met — promote
  await supabase
    .from('companies')
    .update({ status: 'active', type: 'client' })
    .eq('id', companyId);

  return true;
}
