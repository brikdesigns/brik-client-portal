'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@bds/components/ui/Card/Card';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Select } from '@bds/components/ui/Select/Select';
import { Button } from '@bds/components/ui/Button/Button';

const textareaStyle = {
  width: '100%',
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: 'var(--_typography---body--sm)',
  lineHeight: 'var(--font-line-height--150)',
  padding: 'var(--_space---input)',
  borderRadius: 'var(--_border-radius---input)',
  border: 'var(--_border-width---sm) solid var(--_color---border--input)',
  backgroundColor: 'var(--_color---background--input)',
  color: 'var(--_color---text--primary)',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const,
};

const textareaLabelStyle = {
  display: 'block' as const,
  marginBottom: 'var(--_space---sm, 8px)',
  fontFamily: 'var(--_typography---font-family--label)',
  fontWeight: 'var(--font-weight--semi-bold)' as string,
  fontSize: 'var(--_typography---label--md-base)',
  color: 'var(--_color---text--primary)',
};

const sectionHeadingStyle = {
  fontFamily: 'var(--_typography---font-family--heading)',
  fontSize: 'var(--_typography---heading--small, 18px)',
  fontWeight: 600,
  color: 'var(--_color---text--primary)',
  margin: '0 0 16px',
};

const dividerStyle = {
  height: '1px',
  backgroundColor: 'var(--_color---border--secondary)',
  margin: '24px 0',
};

interface Client {
  id: string;
  name: string;
}

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

export default function NewProjectPage() {
  const router = useRouter();

  // ── Project fields ─────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('not_started');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // Load clients from Supabase
  useEffect(() => {
    async function loadClients() {
      const supabase = createClient();
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

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

    const selectedClient = clients.find((c) => c.id === clientId);
    if (!selectedClient) return;

    const matchingFolder = folders.find(
      (f) => f.name.toLowerCase() === selectedClient.name.toLowerCase()
    );
    if (matchingFolder) {
      setFolderId(matchingFolder.id);
    }
  }, [clientId, folders, clients]);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project.');
        return;
      }

      if (data.clickup_warning) {
        setWarning(data.clickup_warning);
        // Still redirect after a brief delay so user sees the warning
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
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--large, 28px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: 0,
          }}
        >
          Add project
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            margin: '8px 0 0',
          }}
        >
          Create a new project for a client.
        </p>
      </div>

      <Card variant="elevated" padding="lg" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          {/* ── Project Details ──────────────────────────── */}
          <h2 style={sectionHeadingStyle}>Project details</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Select a client..."
              options={clients.map((c) => ({
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
            <div>
              <label style={textareaLabelStyle}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project..."
                rows={3}
                style={textareaStyle}
              />
            </div>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: 'Not Started', value: 'not_started' },
                { label: 'In Progress', value: 'active' },
                { label: 'Complete', value: 'completed' },
                { label: 'On Hold', value: 'on_hold' },
                { label: 'Canceled', value: 'cancelled' },
              ]}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

          {/* ── ClickUp Integration ─────────────────────── */}
          <div style={dividerStyle} />
          <h2 style={sectionHeadingStyle}>ClickUp integration</h2>

          {clickupError ? (
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--_color---text--secondary)',
                margin: '0 0 16px',
                padding: '12px',
                backgroundColor: 'var(--_color---surface--secondary)',
                borderRadius: '6px',
              }}
            >
              {clickupError}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                color: 'var(--system--red, #eb5757)',
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                margin: '16px 0 0',
              }}
            >
              {error}
            </p>
          )}

          {warning && (
            <p
              style={{
                color: 'var(--system--orange, #f2994a)',
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                margin: '16px 0 0',
              }}
            >
              {warning}
            </p>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? 'Creating...' : 'Create project'}
            </Button>
            <a href="/admin/projects">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
