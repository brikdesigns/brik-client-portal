'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Button } from '@bds/components/ui/Button/Button';
import { Select } from '@bds/components/ui/Select/Select';
import { ServiceBadge } from '@/components/service-badge';
import { heading } from '@/lib/styles';
import { font, color, space, gap } from '@/lib/tokens';

interface ServiceLineOption {
  id: string;
  name: string;
  slug: string;
}

interface ServiceOption {
  id: string;
  name: string;
  category_slug: string;
  category_id: string;
}

const sectionHeadingStyle = {
  fontFamily: font.family.label,
  fontSize: font.size.body.lg,
  fontWeight: font.weight.medium,
  color: color.text.muted,
  margin: 0,
  paddingTop: space.lg,
};

export default function NewProjectPage() {
  const params = useParams();
  const clientSlug = params.slug as string;
  const [clientId, setClientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clickupTaskId, setClickupTaskId] = useState('');
  const [clickupFolderId, setClickupFolderId] = useState('');
  const [clickupListId, setClickupListId] = useState('');
  const [clickupAssignee, setClickupAssignee] = useState('');
  const [clickupType, setClickupType] = useState('');
  const [clickupStatus, setClickupStatus] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLineOption[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [serviceLineFilter, setServiceLineFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data: company } = await supabase.from('companies').select('id').eq('slug', clientSlug).single();
      if (company) setClientId(company.id);

      const { data: categories } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .order('name');
      setServiceLines((categories ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug })));

      const { data: services } = await supabase
        .from('services')
        .select('id, name, category_id, service_categories(slug)')
        .eq('active', true)
        .order('name');

      setAvailableServices(
        (services ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          category_slug: (s.service_categories as unknown as { slug: string } | null)?.slug ?? 'service',
          category_id: s.category_id ?? '',
        }))
      );
    }
    loadData();
  }, [clientSlug]);

  const filteredServices = useMemo(() => {
    if (!serviceLineFilter) return availableServices;
    return availableServices.filter((s) => s.category_id === serviceLineFilter);
  }, [availableServices, serviceLineFilter]);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: inserted, error: insertError } = await supabase
        .from('projects')
        .insert({
          company_id: clientId,
          name,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
          clickup_task_id: clickupTaskId || null,
          clickup_folder_id: clickupFolderId || null,
          clickup_list_id: clickupListId || null,
          clickup_assignee: clickupAssignee || null,
          clickup_type: clickupType || null,
          clickup_status: clickupStatus || null,
        })
        .select('id')
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Insert service assignments
      if (inserted && selectedServiceIds.length > 0) {
        await supabase
          .from('project_services')
          .insert(selectedServiceIds.map((sid) => ({ project_id: inserted.id, service_id: sid })));
      }

      router.push(`/admin/companies/${clientSlug}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <h1 style={heading.page}>
          Add project
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            margin: `${gap.xs} 0 0`,
          }}
        >
          Create a new project for this client.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <TextInput
            label="Project name"
            type="text"
            placeholder="Website Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief project description..."
            rows={3}
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
            <TextInput
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            <TextInput
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
          </div>

          {/* Services */}
          <p style={sectionHeadingStyle}>Services</p>
          <Select
            label="Service Line"
            value={serviceLineFilter}
            onChange={(e) => setServiceLineFilter(e.target.value)}
            placeholder="All service lines"
            options={serviceLines.map((sl) => ({ label: sl.name, value: sl.id }))}
            fullWidth
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: gap.sm }}>
            {filteredServices.map((svc) => {
              const selected = selectedServiceIds.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => toggleService(svc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: gap.xs,
                    padding: `${gap.xs} ${gap.sm}`,
                    borderRadius: space.sm,
                    border: `1px solid ${selected ? color.brand.primary : color.border.secondary}`,
                    backgroundColor: selected ? color.brand.primary + '10' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: font.family.body,
                    fontSize: font.size.body.sm,
                    color: color.text.primary,
                  }}
                >
                  <ServiceBadge category={svc.category_slug} serviceName={svc.name} size={28} />
                  {svc.name}
                </button>
              );
            })}
            {filteredServices.length === 0 && (
              <span style={{ color: color.text.muted, fontFamily: font.family.body, fontSize: font.size.body.sm }}>
                Loading services...
              </span>
            )}
          </div>

          {/* ClickUp */}
          <p style={sectionHeadingStyle}>ClickUp</p>
          <TextInput
            label="Task ID"
            type="text"
            value={clickupTaskId}
            onChange={(e) => setClickupTaskId(e.target.value)}
            placeholder="e.g. 86abc123"
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
            <TextInput
              label="Folder"
              type="text"
              value={clickupFolderId}
              onChange={(e) => setClickupFolderId(e.target.value)}
              placeholder="Folder name or ID"
              fullWidth
            />
            <TextInput
              label="List"
              type="text"
              value={clickupListId}
              onChange={(e) => setClickupListId(e.target.value)}
              placeholder="List name or ID"
              fullWidth
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.md }}>
            <TextInput
              label="Assignee"
              type="text"
              value={clickupAssignee}
              onChange={(e) => setClickupAssignee(e.target.value)}
              placeholder="Name"
              fullWidth
            />
            <TextInput
              label="Type"
              type="text"
              value={clickupType}
              onChange={(e) => setClickupType(e.target.value)}
              placeholder="e.g. task"
              fullWidth
            />
            <TextInput
              label="Status"
              type="text"
              value={clickupStatus}
              onChange={(e) => setClickupStatus(e.target.value)}
              placeholder="e.g. in progress"
              fullWidth
            />
          </div>
        </div>

        {error && (
          <p
            style={{
              color: color.system.red,
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              margin: `${space.md} 0 0`,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: gap.sm, marginTop: space.lg }}>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Create project
          </Button>
          <a href={`/admin/companies/${clientSlug}`}>
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </div>
  );
}
