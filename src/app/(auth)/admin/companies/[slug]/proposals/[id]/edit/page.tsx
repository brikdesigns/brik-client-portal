'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ServiceBadge } from '@/components/service-badge';
import { ProposalSectionEditor, type ProposalSection } from '@/components/proposal-section-editor';
import { formatCurrency } from '@/lib/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

interface Service {
  id: string;
  name: string;
  slug: string;
  base_price_cents: number | null;
  service_type: string;
  billing_frequency: string | null;
  proposal_copy: string | null;
  service_categories: { slug: string; name: string } | null;
}

interface LineItem {
  id?: string;
  key: string;
  service_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

const iconSize = { width: 12, height: 12 };

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const proposalId = params.id as string;

  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [meetingNotesUrl, setMeetingNotesUrl] = useState('');
  const [meetingNotesContent, setMeetingNotesContent] = useState('');
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // Load proposal
      const { data: proposal } = await supabase
        .from('proposals')
        .select(`
          id, title, status, valid_until, notes, total_amount_cents,
          sections, meeting_notes_url, meeting_notes_content, generation_status,
          company_id,
          companies(id, name, slug),
          proposal_items(id, name, description, quantity, unit_price_cents, sort_order, service_id)
        `)
        .eq('id', proposalId)
        .single();

      if (!proposal) {
        router.push(`/admin/companies/${slug}`);
        return;
      }

      const company = proposal.companies as unknown as { id: string; name: string; slug: string };
      setCompanyId(company.id);
      setCompanyName(company.name);
      setTitle(proposal.title);
      setValidUntil(proposal.valid_until || '');
      setNotes(proposal.notes || '');
      setMeetingNotesUrl(proposal.meeting_notes_url || '');
      setMeetingNotesContent(proposal.meeting_notes_content || '');

      const loadedSections = (proposal.sections as unknown as ProposalSection[]) || [];
      setSections(loadedSections);

      const loadedItems = ((proposal as unknown as Record<string, unknown>).proposal_items as {
        id: string; name: string; description: string | null; quantity: number;
        unit_price_cents: number; sort_order: number; service_id: string | null;
      }[]) || [];

      setItems(
        loadedItems
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(item => ({
            id: item.id,
            key: item.id,
            service_id: item.service_id || '',
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
          }))
      );

      // Load service catalog
      const { data: svcData } = await supabase
        .from('services')
        .select('id, name, slug, base_price_cents, service_type, billing_frequency, proposal_copy, service_categories(slug, name)')
        .order('name');

      if (svcData) {
        setServices(svcData as unknown as Service[]);
      }

      setPageLoading(false);
    }

    load();
  }, [proposalId, slug, router]);

  // --- Section helpers ---

  function updateSection(index: number, updated: ProposalSection) {
    setSections(prev => prev.map((s, i) => (i === index ? updated : s)));
  }

  async function handleGenerateSections() {
    setError('');
    setGenerating(true);

    const serviceIds = items
      .map(i => i.service_id)
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          meeting_notes_url: meetingNotesUrl || undefined,
          service_ids: serviceIds.length > 0 ? serviceIds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed.');
        return;
      }

      setSections(data.sections);
      if (data.meeting_notes_content) setMeetingNotesContent(data.meeting_notes_content);
      if (data.meeting_notes_url) setMeetingNotesUrl(data.meeting_notes_url);
    } catch {
      setError('An unexpected error occurred during generation.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateSection(sectionType: string) {
    setRegeneratingSection(sectionType);

    const serviceIds = items.map(i => i.service_id).filter(Boolean);
    const currentSection = sections.find(s => s.type === sectionType);

    try {
      const res = await fetch('/api/admin/proposals/generate/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          meeting_notes_url: meetingNotesUrl || undefined,
          service_ids: serviceIds.length > 0 ? serviceIds : undefined,
          section_type: sectionType,
          current_content: currentSection?.content || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Regeneration failed.');
        return;
      }

      setSections(prev => prev.map(s => (s.type === sectionType ? data.section : s)));
    } catch {
      setError('Failed to regenerate section.');
    } finally {
      setRegeneratingSection(null);
    }
  }

  // --- Line item helpers ---

  function addItem() {
    setItems([...items, {
      key: crypto.randomUUID(),
      service_id: '',
      name: '',
      description: '',
      quantity: 1,
      unit_price_cents: 0,
    }]);
  }

  function removeItem(key: string) {
    setItems(items.filter(item => item.key !== key));
  }

  function updateItem(key: string, updates: Partial<LineItem>) {
    setItems(items.map(item => (item.key === key ? { ...item, ...updates } : item)));
  }

  function handleServiceSelect(key: string, serviceId: string) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      updateItem(key, {
        service_id: serviceId,
        name: service.name,
        unit_price_cents: service.base_price_cents || 0,
      });
    } else {
      updateItem(key, { service_id: '', name: '', unit_price_cents: 0 });
    }
  }

  const total = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);

  // --- Save ---

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a proposal title.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    const invalidItems = items.filter(item => !item.name.trim());
    if (invalidItems.length > 0) {
      setError('Each line item needs a name.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          valid_until: validUntil || null,
          notes: notes || null,
          sections: sections.length > 0 ? sections : [],
          meeting_notes_url: meetingNotesUrl || null,
          meeting_notes_content: meetingNotesContent || null,
          total_amount_cents: total,
          items: items.map((item, index) => ({
            id: item.id || undefined,
            service_id: item.service_id || undefined,
            name: item.name,
            description: item.description || undefined,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            sort_order: index,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update proposal.');
        return;
      }

      router.push(`/admin/companies/${slug}/proposals/${proposalId}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600 as const,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  const hasSections = sections.length > 0 && sections.some(s => s.content);

  if (pageLoading) {
    return (
      <div>
        <PageHeader title="Edit Proposal" />
        <p style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '14px',
          color: 'var(--_color---text--muted)',
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Proposal"
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Companies', href: '/admin/companies' },
              { label: companyName, href: `/admin/companies/${slug}` },
              { label: title, href: `/admin/companies/${slug}/proposals/${proposalId}` },
              { label: 'Edit' },
            ]}
          />
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Title + validity */}
        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--_space---gap--lg)' }}>
            <TextInput
              label="Proposal Title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextInput
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        {/* Sections */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '720px', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Proposal Sections</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateSections}
              disabled={generating}
            >
              {generating ? (
                'Generating...'
              ) : (
                <>
                  <FontAwesomeIcon icon={faWandMagicSparkles} style={iconSize} />
                  {hasSections ? ' Regenerate All' : ' Generate Sections'}
                </>
              )}
            </Button>
          </div>

          {hasSections ? (
            sections.map((section, index) => (
              <ProposalSectionEditor
                key={section.type}
                section={section}
                sectionIndex={index}
                onChange={updated => updateSection(index, updated)}
                onRegenerate={
                  section.type !== 'fee_summary'
                    ? () => handleRegenerateSection(section.type)
                    : undefined
                }
                regenerating={regeneratingSection === section.type}
              />
            ))
          ) : (
            <Card variant="outlined" padding="lg" style={{ maxWidth: '720px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '14px',
                color: 'var(--_color---text--muted)',
                margin: 0,
              }}>
                No AI-generated sections yet. Click &quot;Generate Sections&quot; to create proposal content from Notion meeting notes.
              </p>
            </Card>
          )}
        </div>

        {/* Line items */}
        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Line Items</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <FontAwesomeIcon icon={faPlus} style={iconSize} /> Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <p style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--muted)',
              textAlign: 'center',
              padding: '24px 0',
            }}>
              No line items yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map(item => {
                const selectedService = services.find(s => s.id === item.service_id);
                const categorySlug = selectedService?.service_categories?.slug;

                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '16px',
                      border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
                      borderRadius: 'var(--_border-radius---md)',
                      backgroundColor: 'var(--_color---surface--secondary)',
                    }}
                  >
                    {categorySlug && (
                      <div style={{ paddingTop: '28px' }}>
                        <ServiceBadge category={categorySlug} size={16} />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Select
                        label="Service"
                        value={item.service_id}
                        onChange={e => handleServiceSelect(item.key, e.target.value)}
                        placeholder="Custom item"
                        options={services.map(s => ({ label: s.name, value: s.id }))}
                        fullWidth
                      />
                      {!item.service_id && (
                        <TextInput
                          label="Item Name"
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(item.key, { name: e.target.value })}
                          placeholder="Custom line item name"
                          fullWidth
                        />
                      )}
                      <TextInput
                        label="Description"
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(item.key, { description: e.target.value })}
                        placeholder="Optional description"
                        fullWidth
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <TextInput
                          label="Qty"
                          type="number"
                          value={String(item.quantity)}
                          onChange={e => updateItem(item.key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          fullWidth
                        />
                        <TextInput
                          label="Unit Price"
                          type="number"
                          value={String(item.unit_price_cents / 100)}
                          onChange={e => updateItem(item.key, { unit_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                          fullWidth
                        />
                      </div>
                      <p style={{
                        fontFamily: 'var(--_typography---font-family--body)',
                        fontSize: '13px',
                        color: 'var(--_color---text--secondary)',
                        margin: 0,
                        textAlign: 'right',
                      }}>
                        Subtotal: {formatCurrency(item.unit_price_cents * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--_color---text--muted)',
                        padding: '4px',
                        marginTop: '24px',
                      }}
                      aria-label="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: '8px',
                borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)',
              }}>
                <p style={{
                  fontFamily: 'var(--_typography---font-family--heading)',
                  fontSize: 'var(--_typography---heading--small, 18px)',
                  fontWeight: 600,
                  color: 'var(--_color---text--primary)',
                  margin: 0,
                }}>
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card variant="elevated" padding="lg" style={{ maxWidth: '720px' }}>
          <TextArea
            label="Notes (internal)"
            placeholder="Internal notes — not visible to the client..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            fullWidth
          />

          {error && (
            <p style={{
              color: 'var(--system--red, #eb5757)',
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: 'var(--_typography---body--sm)',
              margin: 'var(--_space---lg) 0 0',
            }}>
              {error}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: 'var(--_space---gap--md)',
            marginTop: 'var(--_space---xl)',
            justifyContent: 'space-between',
          }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => router.push(`/admin/companies/${slug}/proposals/${proposalId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
