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
import { heading } from '@/lib/styles';
import { font, color, space, gap, border } from '@/lib/tokens';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@bds/components/ui/Modal/Modal';
import { RewriteNotesPicker } from '@/components/rewrite-notes-picker';

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

  const [showRewriteModal, setShowRewriteModal] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');

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

  /** Helper: POST JSON and return parsed response or throw */
  async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        res.status === 504 || res.status === 502
          ? 'Request timed out. Try again.'
          : `Server error (${res.status}). Try again.`
      );
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data as T;
  }

  /**
   * Rewrite all proposal sections. If newMeetingNotes is provided,
   * updates the proposal's meeting notes first (so pipeline mode picks them up).
   */
  async function handleGenerateSections(newMeetingNotes?: { content: string; url?: string }) {
    setError('');
    setGenerating(true);
    setShowRewriteModal(false);

    const sectionSteps = [
      { type: 'overview_and_goals', label: 'Writing overview...' },
      { type: 'scope_of_project', label: 'Writing scope...' },
      { type: 'project_timeline', label: 'Writing timeline...' },
      { type: 'why_brik', label: 'Finalizing...' },
    ];

    try {
      // If new meeting notes were selected, update the proposal first
      if (newMeetingNotes) {
        setGeneratingStep('Updating meeting notes...');
        const patchRes = await fetch(`/api/admin/proposals/${proposalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_notes_content: newMeetingNotes.content,
            meeting_notes_url: newMeetingNotes.url || null,
          }),
        });
        if (!patchRes.ok) {
          const data = await patchRes.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || 'Failed to update meeting notes.');
        }
        setMeetingNotesContent(newMeetingNotes.content);
        if (newMeetingNotes.url) setMeetingNotesUrl(newMeetingNotes.url);
      }

      // Pipeline mode: proposal already exists, server reads notes + services from DB
      const generatedSections: ProposalSection[] = [];

      for (const step of sectionSteps) {
        setGeneratingStep(step.label);
        const { section } = await postJSON<{ section: ProposalSection }>(
          '/api/admin/proposals/generate/section',
          {
            proposal_id: proposalId,
            section_type: step.type,
          },
        );
        generatedSections.push(section);
      }

      // Keep existing fee_summary or add placeholder
      const existingFee = sections.find(s => s.type === 'fee_summary');
      generatedSections.push(existingFee || {
        type: 'fee_summary',
        title: 'Fee Summary',
        content: '',
        sort_order: 5,
      } as ProposalSection);

      setSections(generatedSections);
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during generation.');
    } finally {
      setGenerating(false);
      setGeneratingStep('');
    }
  }

  async function handleRegenerateSection(sectionType: string) {
    setRegeneratingSection(sectionType);
    const currentSection = sections.find(s => s.type === sectionType);

    try {
      // Pipeline mode: server reads notes + services from the proposal row
      const { section } = await postJSON<{ section: ProposalSection }>(
        '/api/admin/proposals/generate/section',
        {
          proposal_id: proposalId,
          section_type: sectionType,
          current_content: currentSection?.content || undefined,
        },
      );
      setSections(prev => prev.map(s => (s.type === sectionType ? section : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate section.');
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

  const sectionHeadingStyle = heading.section;

  const hasSections = sections.length > 0 && sections.some(s => s.content);

  if (pageLoading) {
    return (
      <div>
        <PageHeader title="Edit Proposal" />
        <p style={{
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          color: color.text.muted,
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
              { label: 'Proposal', href: `/admin/companies/${slug}/proposals/${proposalId}` },
              { label: 'Edit' },
            ]}
          />
        }
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconBefore={<FontAwesomeIcon icon={faWandMagicSparkles} style={iconSize} />}
            onClick={() => setShowRewriteModal(true)}
            disabled={generating}
          >
            {generating ? (generatingStep || 'Generating...') : 'Rewrite Proposal'}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Title + validity */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: space.lg }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
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
        <div style={{ marginBottom: space.lg }}>
          <h2 style={{ ...sectionHeadingStyle, margin: 0, marginBottom: space.md }}>Proposal Sections</h2>

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
            <Card variant="outlined" padding="lg" style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.sm,
                color: color.text.muted,
                margin: 0,
              }}>
                No AI-generated sections yet. Click &quot;Generate Sections&quot; to create proposal content from Notion meeting notes.
              </p>
            </Card>
          )}
        </div>

        {/* Line items */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: space.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Line Items</h2>
            <Button type="button" variant="secondary" size="sm" iconBefore={<FontAwesomeIcon icon={faPlus} style={iconSize} />} onClick={addItem}>
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <p style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              color: color.text.muted,
              textAlign: 'center',
              padding: `${space.lg} 0`,
            }}>
              No line items yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
              {items.map(item => {
                const selectedService = services.find(s => s.id === item.service_id);
                const categorySlug = selectedService?.service_categories?.slug;

                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      gap: gap.sm,
                      alignItems: 'flex-start',
                      padding: space.md,
                      border: `${border.width.sm} solid ${color.border.muted}`,
                      borderRadius: border.radius.md,
                      backgroundColor: color.surface.secondary,
                    }}
                  >
                    {categorySlug && (
                      <div style={{ paddingTop: '28px' }}>
                        <ServiceBadge category={categorySlug} serviceName={item.name} size={28} />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: gap.sm }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.sm }}>
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
                        fontFamily: font.family.body,
                        fontSize: font.size.body.xs,
                        color: color.text.secondary,
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
                        color: color.text.muted,
                        padding: gap.xs,
                        marginTop: space.lg,
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
                paddingTop: gap.xs,
                borderTop: `${border.width.sm} solid ${color.border.muted}`,
              }}>
                <p style={{
                  fontFamily: font.family.heading,
                  fontSize: font.size.heading.small,
                  fontWeight: font.weight.semibold,
                  color: color.text.primary,
                  margin: 0,
                }}>
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card variant="elevated" padding="lg" style={{ marginBottom: space.lg }}>
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
              color: color.system.red,
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              margin: `${space.lg} 0 0`,
            }}>
              {error}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: gap.md,
            marginTop: space.xl,
            justifyContent: 'space-between',
          }}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => router.push(`/admin/companies/${slug}/proposals/${proposalId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Save Changes
            </Button>
          </div>
        </Card>
      </form>

      {/* Rewrite modal — pick a meeting note before regenerating */}
      <Modal
        isOpen={showRewriteModal}
        onClose={() => setShowRewriteModal(false)}
        title="Rewrite Proposal"
        size="md"
      >
        <RewriteNotesPicker
          companyName={companyName}
          currentMeetingNotes={meetingNotesContent}
          onRewrite={(notes) => handleGenerateSections(notes)}
          onRewriteWithExisting={() => handleGenerateSections()}
          generating={generating}
          generatingStep={generatingStep}
        />
      </Modal>
    </div>
  );
}
