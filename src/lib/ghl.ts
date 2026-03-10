/**
 * GoHighLevel API v2 client
 *
 * Docs: https://highlevel.stoplight.io/docs/integrations
 * Location ID: IZPqVFfrhjIQrXkmHChN
 */

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_LOCATION_ID = 'IZPqVFfrhjIQrXkmHChN';

function getApiKey(): string {
  const key = process.env.GHL_API_KEY;
  if (!key) throw new Error('GHL_API_KEY is not set in environment variables');
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

// ── Types ──────────────────────────────────────────────────────────

export interface GHLContact {
  id: string;
  contactName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  dateAdded?: string;
  dateUpdated?: string;
  dnd?: boolean;
  customFields?: { id: string; key: string; value: string; field_value: string }[];
}

export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue?: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  dateAdded?: string;
}

// ── API Methods ────────────────────────────────────────────────────

/** Fetch a single contact by GHL contact ID */
export async function getContact(contactId: string): Promise<GHLContact> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL getContact failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.contact;
}

/** Search contacts by email or company name */
export async function searchContacts(query: string): Promise<GHLContact[]> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    query,
    limit: '20',
  });
  const res = await fetch(`${GHL_BASE}/contacts/?${params}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL searchContacts failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.contacts ?? [];
}

/** Get all opportunities for a contact */
export async function getContactOpportunities(contactId: string): Promise<GHLOpportunity[]> {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    contactId,
  });
  const res = await fetch(`${GHL_BASE}/opportunities/search?${params}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL getContactOpportunities failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.opportunities ?? [];
}

/** Get pipeline details (for resolving stage names) */
export async function getPipelines(): Promise<{ id: string; name: string; stages: { id: string; name: string }[] }[]> {
  const params = new URLSearchParams({ locationId: GHL_LOCATION_ID });
  const res = await fetch(`${GHL_BASE}/opportunities/pipelines?${params}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL getPipelines failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.pipelines ?? [];
}

/** GHL location ID for building URLs */
export const LOCATION_ID = GHL_LOCATION_ID;
