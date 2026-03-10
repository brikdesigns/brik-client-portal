'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { font, color, space, gap } from '@/lib/tokens';
import { heading } from '@/lib/styles';
import { useToast } from '@/components/toast-provider';
import { formatCurrency } from '@/lib/format';

const pipelineOptions = [
  { label: 'None', value: '' },
  { label: 'New Lead', value: 'New Lead' },
  { label: 'Qualified', value: 'Qualified' },
  { label: 'Proposal Sent', value: 'Proposal Sent' },
  { label: 'Negotiation', value: 'Negotiation' },
  { label: 'Closed Won', value: 'Closed Won' },
  { label: 'Closed Lost', value: 'Closed Lost' },
];

const stageOptions = [
  { label: 'None', value: '' },
  { label: 'Discovery', value: 'Discovery' },
  { label: 'Needs Analysis', value: 'Needs Analysis' },
  { label: 'Proposal', value: 'Proposal' },
  { label: 'Negotiation', value: 'Negotiation' },
  { label: 'Onboarding', value: 'Onboarding' },
];

interface EditOpportunitiesFormProps {
  company: {
    id: string;
    name: string;
    slug: string;
    pipeline: string | null;
    pipeline_stage: string | null;
    opportunity_owner: string | null;
    followers: string | null;
    introduction_date: string | null;
    ghl_contact_id: string | null;
    ghl_source: string | null;
    ghl_opportunity_value_cents: number | null;
    ghl_tags: string[] | null;
    ghl_last_synced: string | null;
  };
}

export function EditOpportunitiesForm({ company }: EditOpportunitiesFormProps) {
  const [pipeline, setPipeline] = useState(company.pipeline ?? '');
  const [pipelineStage, setPipelineStage] = useState(company.pipeline_stage ?? '');
  const [opportunityOwner, setOpportunityOwner] = useState(company.opportunity_owner ?? '');
  const [followers, setFollowers] = useState(company.followers ?? '');
  const [introductionDate, setIntroductionDate] = useState(company.introduction_date ?? '');
  const [ghlContactId, setGhlContactId] = useState(company.ghl_contact_id ?? '');
  const [ghlSource, setGhlSource] = useState(company.ghl_source ?? '');
  const [ghlOpportunityValue, setGhlOpportunityValue] = useState(
    company.ghl_opportunity_value_cents ? (company.ghl_opportunity_value_cents / 100).toString() : ''
  );
  const [ghlTags, setGhlTags] = useState<string[]>(company.ghl_tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toastSuccess } = useToast();

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !ghlTags.includes(tag)) {
      setGhlTags([...ghlTags, tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setGhlTags(ghlTags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const valueCents = ghlOpportunityValue ? Math.round(parseFloat(ghlOpportunityValue) * 100) : null;

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          pipeline: pipeline || null,
          pipeline_stage: pipelineStage || null,
          opportunity_owner: opportunityOwner || null,
          followers: followers || null,
          introduction_date: introductionDate || null,
          ghl_contact_id: ghlContactId || null,
          ghl_source: ghlSource || null,
          ghl_opportunity_value_cents: valueCents,
          ghl_tags: ghlTags.length > 0 ? ghlTags : null,
        })
        .eq('id', company.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      toastSuccess('Opportunities updated');
      router.push(`/admin/companies/${company.slug}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
        <h2 style={{ ...heading.section, margin: 0 }}>Pipeline</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.lg }}>
          <Select
            label="Pipeline"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value)}
            options={pipelineOptions}
            fullWidth
          />
          <Select
            label="Stage"
            value={pipelineStage}
            onChange={(e) => setPipelineStage(e.target.value)}
            options={stageOptions}
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.lg }}>
          <TextInput
            label="Owner"
            type="text"
            placeholder="Opportunity owner"
            value={opportunityOwner}
            onChange={(e) => setOpportunityOwner(e.target.value)}
            fullWidth
          />
          <TextInput
            label="Followers"
            type="text"
            placeholder="Comma-separated names"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            fullWidth
          />
        </div>

        <TextInput
          label="Introduction Date"
          type="date"
          value={introductionDate}
          onChange={(e) => setIntroductionDate(e.target.value)}
          fullWidth
        />

        <h2 style={{ ...heading.section, margin: 0, paddingTop: space.lg }}>GoHighLevel</h2>

        <TextInput
          label="GHL Contact ID"
          type="text"
          placeholder="Paste GoHighLevel contact ID"
          value={ghlContactId}
          onChange={(e) => setGhlContactId(e.target.value)}
          helperText={ghlContactId ? `https://app.gohighlevel.com/v2/location/.../contacts/detail/${ghlContactId}` : undefined}
          fullWidth
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.lg }}>
          <TextInput
            label="Source"
            type="text"
            placeholder="Lead source"
            value={ghlSource}
            onChange={(e) => setGhlSource(e.target.value)}
            fullWidth
          />
          <TextInput
            label="Opportunity Value"
            type="number"
            placeholder="0.00"
            value={ghlOpportunityValue}
            onChange={(e) => setGhlOpportunityValue(e.target.value)}
            helperText={ghlOpportunityValue ? formatCurrency(Math.round(parseFloat(ghlOpportunityValue) * 100)) : undefined}
            fullWidth
          />
        </div>

        <div>
          <div style={{ display: 'flex', gap: gap.sm, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <TextInput
                label="Tags"
                type="text"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                fullWidth
              />
            </div>
            <Button type="button" variant="secondary" size="md" onClick={addTag}>
              Add
            </Button>
          </div>
          {ghlTags.length > 0 && (
            <div style={{ display: 'flex', gap: gap.sm, flexWrap: 'wrap', marginTop: gap.sm }}>
              {ghlTags.map((tag) => (
                <Tag
                  key={tag}
                  size="sm"
                  onRemove={() => removeTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>

        {company.ghl_last_synced && (
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted, margin: 0 }}>
            Last synced: {new Date(company.ghl_last_synced).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <p
          style={{
            color: color.system.red,
            fontFamily: font.family.body,
            fontSize: font.size.body.sm,
            margin: `${space.lg} 0 0`,
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          gap: gap.md,
          marginTop: space.xl,
          justifyContent: 'flex-end',
        }}
      >
        <a href={`/admin/companies/${company.slug}`}>
          <Button type="button" variant="secondary" size="md">
            Cancel
          </Button>
        </a>
        <Button type="submit" variant="primary" size="md" loading={loading}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
