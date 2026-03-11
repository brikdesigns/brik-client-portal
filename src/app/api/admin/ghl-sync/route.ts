import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, isAuthError } from '@/lib/auth';
import { getContact, getContactOpportunities, getPipelines } from '@/lib/ghl';
import { parseBody, isValidationError, uuidSchema } from '@/lib/validation';
import { rateLimitOrNull, EXTERNAL_SYNC_LIMIT } from '@/lib/rate-limit';

const ghlSyncSchema = z.object({
  company_id: uuidSchema,
});

/**
 * POST /api/admin/ghl-sync
 *
 * Syncs a company's data from GoHighLevel.
 * Requires: { company_id: string }
 * The company must have a ghl_contact_id set.
 *
 * Pulls: contact info, tags, source, opportunity value, pipeline/stage.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const supabase = await createClient();

  const body = await parseBody(request, ghlSyncSchema);
  if (isValidationError(body)) return body;
  const { company_id } = body;

  // Get company with ghl_contact_id
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, ghl_contact_id')
    .eq('id', company_id)
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (!company.ghl_contact_id) {
    return NextResponse.json(
      { error: 'Company has no GoHighLevel contact ID. Set ghl_contact_id first.' },
      { status: 400 },
    );
  }

  try {
    // Fetch contact from GHL
    const contact = await getContact(company.ghl_contact_id);

    // Fetch opportunities for this contact
    const opportunities = await getContactOpportunities(company.ghl_contact_id);

    // Find highest-value opportunity
    const primaryOpportunity = opportunities
      .filter((o) => o.status === 'open')
      .sort((a, b) => (b.monetaryValue ?? 0) - (a.monetaryValue ?? 0))[0] ?? null;

    // Resolve pipeline + stage names
    let pipelineName: string | null = null;
    let stageName: string | null = null;
    if (primaryOpportunity) {
      const pipelines = await getPipelines();
      const pipeline = pipelines.find((p) => p.id === primaryOpportunity.pipelineId);
      if (pipeline) {
        pipelineName = pipeline.name;
        const stage = pipeline.stages.find((s) => s.id === primaryOpportunity.pipelineStageId);
        if (stage) stageName = stage.name;
      }
    }

    // Build update payload
    const updates: Record<string, unknown> = {
      ghl_tags: contact.tags ?? [],
      ghl_source: contact.source ?? null,
      ghl_last_synced: new Date().toISOString(),
    };

    // Opportunity value (GHL stores in dollars, we store in cents)
    if (primaryOpportunity?.monetaryValue) {
      updates.ghl_opportunity_value_cents = Math.round(primaryOpportunity.monetaryValue * 100);
    }

    // Sync contact details if not already set in portal
    const { data: currentCompany } = await supabase
      .from('companies')
      .select('phone, address, city, state, postal_code, pipeline, pipeline_stage, introduction_date')
      .eq('id', company_id)
      .single();

    if (currentCompany) {
      // Only fill empty fields — don't overwrite portal data
      if (!currentCompany.phone && contact.phone) updates.phone = contact.phone;
      if (!currentCompany.address && contact.address1) updates.address = contact.address1;
      if (!currentCompany.city && contact.city) updates.city = contact.city;
      if (!currentCompany.state && contact.state) updates.state = contact.state;
      if (!currentCompany.postal_code && contact.postalCode) updates.postal_code = contact.postalCode;
      if (!currentCompany.introduction_date && contact.dateAdded) {
        updates.introduction_date = contact.dateAdded.split('T')[0];
      }
      // Pipeline/stage — always update from GHL (source of truth)
      if (pipelineName) updates.pipeline = pipelineName;
      if (stageName) updates.pipeline_stage = stageName;
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      synced: {
        tags: contact.tags ?? [],
        source: contact.source ?? null,
        opportunity_value: primaryOpportunity?.monetaryValue ?? null,
        pipeline: pipelineName,
        pipeline_stage: stageName,
        fields_updated: Object.keys(updates),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `GHL sync failed: ${message}` }, { status: 500 });
  }
}
