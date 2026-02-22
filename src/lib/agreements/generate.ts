import { createClient as createServiceClient } from '@supabase/supabase-js';
import { mergeTemplate, MergeData } from './merge';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AgreementType = 'marketing_agreement' | 'baa';

const HEALTHCARE_KEYWORDS = ['dental', 'dentist', 'healthcare', 'medical', 'health', 'clinic', 'hospital', 'physician', 'orthodont'];

function isHealthcareClient(industry: string | null): boolean {
  if (!industry) return false;
  const lower = industry.toLowerCase();
  return HEALTHCARE_KEYWORDS.some((kw) => lower.includes(kw));
}

interface GenerateResult {
  id: string;
  type: AgreementType;
  token: string;
  title: string;
  status: string;
}

/**
 * Generate an agreement from a template for a given proposal + client.
 * Called after proposal acceptance. Uses service role key (bypasses RLS).
 */
export async function generateAgreement(
  proposalId: string,
  clientId: string,
  type: AgreementType
): Promise<GenerateResult> {
  const supabase = getServiceClient();

  // 1. Fetch active template for this type
  const { data: template, error: templateError } = await supabase
    .from('agreement_templates')
    .select('id, title, content')
    .eq('type', type)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (templateError || !template) {
    throw new Error(`No active template found for type: ${type}`);
  }

  // 2. Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('companies')
    .select('name, address, contact_name, contact_email, phone')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  // 3. Fetch proposal with items (join services for billing_frequency)
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      id, title, total_amount_cents,
      proposal_items(id, name, description, quantity, unit_price_cents, sort_order, service_id,
        services(service_type, billing_frequency)
      )
    `)
    .eq('id', proposalId)
    .single();

  if (proposalError || !proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  // 4. Build merge data
  const items = (proposal.proposal_items as unknown as Array<{
    name: string;
    description: string | null;
    quantity: number;
    unit_price_cents: number;
    sort_order: number;
    services: { service_type: string; billing_frequency: string | null } | null;
  }>)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      service_type: item.services?.service_type ?? null,
      billing_frequency: item.services?.billing_frequency ?? null,
    }));

  const mergeData: MergeData = {
    client: {
      name: client.name,
      address: client.address,
      contact_name: client.contact_name,
      contact_email: client.contact_email,
      phone: client.phone,
    },
    proposal: {
      title: proposal.title,
      total_amount_cents: proposal.total_amount_cents,
      items,
    },
    effectiveDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  // 5. Merge template with data
  const contentSnapshot = mergeTemplate(template.content, mergeData);

  // 6. Generate token and insert agreement
  const token = crypto.randomUUID();

  const { data: agreement, error: insertError } = await supabase
    .from('agreements')
    .insert({
      company_id: clientId,
      proposal_id: proposalId,
      template_id: template.id,
      type,
      title: template.title,
      status: 'draft',
      token,
      content_snapshot: contentSnapshot,
    })
    .select('id, type, token, title, status')
    .single();

  if (insertError || !agreement) {
    throw new Error(`Failed to create agreement: ${insertError?.message}`);
  }

  return agreement as GenerateResult;
}

/**
 * Generate all required agreements for a client after proposal acceptance.
 * Always creates a Marketing Agreement. Also creates BAA if client is in healthcare.
 */
export async function generateAgreementsForProposal(
  proposalId: string,
  clientId: string
): Promise<GenerateResult[]> {
  const supabase = getServiceClient();

  // Check client industry for BAA requirement
  const { data: client } = await supabase
    .from('companies')
    .select('industry')
    .eq('id', clientId)
    .single();

  const results: GenerateResult[] = [];

  // Always generate Marketing Agreement
  const marketing = await generateAgreement(proposalId, clientId, 'marketing_agreement');
  results.push(marketing);

  // Generate BAA if healthcare client
  if (client && isHealthcareClient(client.industry)) {
    const baa = await generateAgreement(proposalId, clientId, 'baa');
    results.push(baa);
  }

  return results;
}
