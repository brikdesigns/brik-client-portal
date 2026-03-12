'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { TextArea } from '@bds/components/ui/TextArea/TextArea';
import { Select } from '@bds/components/ui/Select/Select';
import { MultiSelect } from '@bds/components/ui/MultiSelect/MultiSelect';
import { Button } from '@bds/components/ui/Button/Button';

import { heading } from '@/lib/styles';
import { font, color, space, gap, border } from '@/lib/tokens';

const sectionHeadingStyle = heading.section;

const dividerStyle = {
  height: '1px',
  backgroundColor: color.border.secondary,
  margin: `${space.lg} 0`,
};

interface ClickUpFolder {
  id: string;
  name: string;
}

interface ClickUpList {
  id: string;
  name: string;
}

interface ClickUpMember {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
}

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

interface NewProjectFormProps {
  companies: Array<{ id: string; name: string }>;
  serviceLines: ServiceLineOption[];
  availableServices: ServiceOption[];
}

export function NewProjectForm({ companies, serviceLines, availableServices }: NewProjectFormProps) {
  const router = useRouter();

  // ── Project fields ─────────────────────────────────────
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('not_started');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Service fields ───────────────────────────────────
  const [serviceLineFilter, setServiceLineFilter] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const serviceOptions = useMemo(() => {
    const base = serviceLineFilter
      ? availableServices.filter((s) => s.category_id === serviceLineFilter)
      : availableServices;
    return base.map((s) => ({ label: s.name, value: s.id }));
  }, [availableServices, serviceLineFilter]);

  // ── ClickUp fields ─────────────────────────────────────
  const [folders, setFolders] = useState<ClickUpFolder[]>([]);
  const [folderId, setFolderId] = useState('');
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [listId, setListId] = useState('');
  const [members, setMembers] = useState<ClickUpMember[]>([]);
  const [assigneeId, setAssigneeId] = useState('');

  // ── Loading states ─────────────────────────────────────
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [listsLoading, setListsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [clickupError, setClickupError] = useState('');

  // ── Form state ─────────────────────────────────────────
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  // Load ClickUp folders + members on mount
  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch('/api/admin/clickup/folders');
        if (!res.ok) throw new Error('Failed to load folders');
        const data = await res.json();
        setFolders(data.folders || []);
      } catch {
        setClickupError('Could not connect to ClickUp. You can still create the project without a linked task.');
      } finally {
        setFoldersLoading(false);
      }
    }

    async function loadMembers() {
      try {
        const res = await fetch('/api/admin/clickup/members');
        if (!res.ok) throw new Error('Failed to load members');
        const data = await res.json();
        setMembers(data.members || []);
      } catch {
        // Non-critical — folder load already shows clickupError
      } finally {
        setMembersLoading(false);
      }
    }

    loadFolders();
    loadMembers();
  }, []);

  // Auto-select ClickUp folder when portal client is selected
  useEffect(() => {
    if (!clientId || folders.length === 0) return;

    const selectedClient = companies.find((c) => c.id === clientId);
    if (!selectedClient) return;

    const matchingFolder = folders.find(
      (f) => f.name.toLowerCase() === selectedClient.name.toLowerCase()
    );
    if (matchingFolder) {
      setFolderId(matchingFolder.id);
    }
  }, [clientId, folders, companies]);

  // Load ClickUp lists when folder changes
  useEffect(() => {
    if (!folderId) {
      setLists([]);
      setListId('');
      return;
    }

    async function loadLists() {
      setListsLoading(true);
      setListId('');
      try {
        const res = await fetch(`/api/admin/clickup/lists?folder_id=${folderId}`);
        if (!res.ok) throw new Error('Failed to load lists');
        const data = await res.json();
        setLists(data.lists || []);
      } catch {
        setLists([]);
      } finally {
        setListsLoading(false);
      }
    }
    loadLists();
  }, [folderId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setWarning('');

    if (!clientId) {
      setError('Please select a client.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company_id: clientId,
          description: description || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          clickup_list_id: listId || null,
          clickup_assignee_id: assigneeId ? Number(assigneeId) : null,
          service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project.');
        return;
      }

      if (data.clickup_warning) {
        setWarning(data.clickup_warning);
        setTimeout(() => {
          router.push('/admin/projects');
          router.refresh();
        }, 2000);
        return;
      }

      router.push('/admin/projects');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        {/* ── Project Details ──────────────────────────── */}
        <h2 style={sectionHeadingStyle}>Project details</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Select a client..."
            options={companies.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            fullWidth
          />
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
            placeholder="Brief description of this project..."
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
        </div>

        {/* ── Services ────────────────────────────────── */}
        <div style={dividerStyle} />
        <h2 style={sectionHeadingStyle}>Services</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <Select
            label="Service Line"
            value={serviceLineFilter}
            onChange={(e) => setServiceLineFilter(e.target.value)}
            placeholder="All service lines"
            options={serviceLines.map((sl) => ({
              label: sl.name,
              value: sl.id,
            }))}
            fullWidth
          />
          <MultiSelect
            label="Services"
            placeholder={serviceLineFilter ? 'Select a service...' : 'Select a service line first'}
            options={serviceOptions}
            value={selectedServiceIds}
            onChange={setSelectedServiceIds}
            fullWidth
          />
        </div>

        {/* ── ClickUp Integration ─────────────────────── */}
        <div style={dividerStyle} />
        <h2 style={sectionHeadingStyle}>ClickUp integration</h2>

        {clickupError ? (
          <p
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.xs,
              color: color.text.secondary,
              margin: `0 0 ${space.md}`,
              padding: space.sm,
              backgroundColor: color.surface.secondary,
              borderRadius: border.radius.md,
            }}
          >
            {clickupError}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md }}>
              <Select
                label="Client folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder={foldersLoading ? 'Loading...' : 'Select a folder...'}
                options={folders.map((f) => ({
                  label: f.name,
                  value: f.id,
                }))}
                disabled={foldersLoading}
                helperText="Filters the list dropdown"
                fullWidth
              />
              <Select
                label="ClickUp list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                placeholder={
                  !folderId
                    ? 'Select a folder first'
                    : listsLoading
                      ? 'Loading...'
                      : 'Select a list...'
                }
                options={lists.map((l) => ({
                  label: l.name,
                  value: l.id,
                }))}
                disabled={!folderId || listsLoading}
                fullWidth
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.md }}>
              <Select
                label="Assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                placeholder={membersLoading ? 'Loading...' : 'Select...'}
                options={members.map((m) => ({
                  label: m.username || m.email,
                  value: String(m.id),
                }))}
                disabled={membersLoading}
                fullWidth
              />
              <Select
                label="Type"
                value="task"
                options={[{ label: 'Task', value: 'task' }]}
                disabled
                fullWidth
              />
              <Select
                label="Task status"
                value="to_do"
                options={[{ label: 'TO DO', value: 'to_do' }]}
                disabled
                fullWidth
              />
            </div>
          </div>
        )}

        {/* ── Messages ────────────────────────────────── */}
        {error && (
          <p
            style={{
              color: color.system.red,
              fontFamily: font.family.body,
              fontSize: font.size.body.xs,
              margin: `${space.md} 0 0`,
            }}
          >
            {error}
          </p>
        )}

        {warning && (
          <p
            style={{
              color: color.system.orange,
              fontFamily: font.family.body,
              fontSize: font.size.body.xs,
              margin: `${space.md} 0 0`,
            }}
          >
            {warning}
          </p>
        )}

        {/* ── Actions ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: gap.sm, marginTop: space.lg }}>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Create project
          </Button>
          <a href="/admin/projects">
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </a>
        </div>
    </form>
  );
}
