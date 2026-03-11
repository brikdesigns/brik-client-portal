'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';
import { ServiceBadge } from '@/components/service-badge';
import { font, color, space, gap } from '@/lib/tokens';

const sectionHeadingStyle = {
  fontFamily: font.family.label,
  fontSize: font.size.body.lg,
  fontWeight: font.weight.medium,
  color: color.text.muted,
  margin: 0,
  paddingTop: space.lg,
};

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export interface ServiceOption {
  id: string;
  name: string;
  category_slug: string;
}

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    clickup_task_id: string | null;
    clickup_folder_id: string | null;
    clickup_list_id: string | null;
    clickup_assignee: string | null;
    clickup_type: string | null;
    clickup_status: string | null;
  };
  clientName: string;
  availableServices: ServiceOption[];
  assignedServiceIds: string[];
}

export function EditProjectForm({ project, clientName, availableServices, assignedServiceIds }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.start_date ?? '');
  const [endDate, setEndDate] = useState(project.end_date ?? '');
  const [clickupTaskId, setClickupTaskId] = useState(project.clickup_task_id ?? '');
  const [clickupFolderId, setClickupFolderId] = useState(project.clickup_folder_id ?? '');
  const [clickupListId, setClickupListId] = useState(project.clickup_list_id ?? '');
  const [clickupAssignee, setClickupAssignee] = useState(project.clickup_assignee ?? '');
  const [clickupType, setClickupType] = useState(project.clickup_type ?? '');
  const [clickupStatus, setClickupStatus] = useState(project.clickup_status ?? '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(assignedServiceIds);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const newSlug = toSlug(name);

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name,
          slug: newSlug,
          description: description || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          clickup_task_id: clickupTaskId || null,
          clickup_folder_id: clickupFolderId || null,
          clickup_list_id: clickupListId || null,
          clickup_assignee: clickupAssignee || null,
          clickup_type: clickupType || null,
          clickup_status: clickupStatus || null,
        })
        .eq('id', project.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sync project_services: delete removed, insert added
      const currentIds = new Set(assignedServiceIds);
      const newIds = new Set(selectedServiceIds);
      const toRemove = assignedServiceIds.filter((id) => !newIds.has(id));
      const toAdd = selectedServiceIds.filter((id) => !currentIds.has(id));

      if (toRemove.length > 0) {
        await supabase
          .from('project_services')
          .delete()
          .eq('project_id', project.id)
          .in('service_id', toRemove);
      }
      if (toAdd.length > 0) {
        await supabase
          .from('project_services')
          .insert(toAdd.map((sid) => ({ project_id: project.id, service_id: sid })));
      }

      router.push(`/admin/projects/${newSlug}`);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div
        style={{
          fontFamily: font.family.body,
          fontSize: font.size.body.sm,
          color: color.text.muted,
          marginBottom: space.lg,
        }}
      >
        Client: <span style={{ color: color.text.primary, fontWeight: font.weight.medium }}>{clientName}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
          <TextInput
            label="Project name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            fullWidth
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Select status"
            options={[
              { label: 'Not Started', value: 'not_started' },
              { label: 'In Progress', value: 'active' },
              { label: 'Complete', value: 'completed' },
              { label: 'On Hold', value: 'on_hold' },
              { label: 'Canceled', value: 'cancelled' },
            ]}
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.md }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: gap.sm }}>
            {availableServices.map((svc) => {
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
                  <ServiceBadge category={svc.category_slug} size={12} />
                  {svc.name}
                </button>
              );
            })}
            {availableServices.length === 0 && (
              <span style={{ color: color.text.muted, fontFamily: font.family.body, fontSize: font.size.body.sm }}>
                No services available.
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.md }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.md }}>
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

        <div style={{ display: 'flex', gap: gap.md, marginTop: space.lg }}>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save changes
          </Button>
          <a href={`/admin/projects/${project.slug}`}>
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </div>
  );
}
