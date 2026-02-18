/**
 * ClickUp REST API v2 client — server-side only.
 *
 * Uses CLICKUP_API_TOKEN from environment (personal API token).
 * Never import this file from client components.
 */

const BASE_URL = 'https://api.clickup.com/api/v2';

// Brik Designs workspace
const CLIENTS_SPACE_ID = '90135466353';

function getToken(): string {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN is not set');
  return token;
}

async function clickupFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: getToken(),
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ClickUp API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────

export interface ClickUpFolder {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpMember {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
}

interface ClickUpFoldersResponse {
  folders: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
}

interface ClickUpListsResponse {
  lists: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
}

interface ClickUpMembersResponse {
  members: Array<{
    user: {
      id: number;
      username: string;
      email: string;
      profilePicture: string | null;
    };
  }>;
}

interface ClickUpTaskResponse {
  id: string;
  name: string;
  url: string;
  [key: string]: unknown;
}

// ── API Functions ──────────────────────────────────────

/**
 * Get all folders in the Clients space.
 * Each folder represents a client in ClickUp.
 */
export async function getFolders(): Promise<ClickUpFolder[]> {
  const data = await clickupFetch<ClickUpFoldersResponse>(
    `/space/${CLIENTS_SPACE_ID}/folder`
  );
  return data.folders.map((f) => ({ id: f.id, name: f.name }));
}

/**
 * Get lists within a specific folder.
 * Each list typically represents a project phase or category.
 */
export async function getLists(folderId: string): Promise<ClickUpList[]> {
  const data = await clickupFetch<ClickUpListsResponse>(
    `/folder/${folderId}/list`
  );
  return data.lists.map((l) => ({ id: l.id, name: l.name }));
}

/**
 * Get workspace members (from a known list in the Clients space).
 * ClickUp's member endpoint is list-scoped, so we grab the first available list.
 */
export async function getMembers(): Promise<ClickUpMember[]> {
  // Get a list to query members from (any list works — members are workspace-wide)
  const folders = await getFolders();
  if (folders.length === 0) return [];

  const lists = await getLists(folders[0].id);
  if (lists.length === 0) return [];

  const data = await clickupFetch<ClickUpMembersResponse>(
    `/list/${lists[0].id}/member`
  );
  return data.members.map((m) => ({
    id: m.user.id,
    username: m.user.username,
    email: m.user.email,
    profilePicture: m.user.profilePicture,
  }));
}

/**
 * Create a task in a ClickUp list.
 */
export async function createTask(
  listId: string,
  payload: {
    name: string;
    description?: string;
    assignees?: number[];
    status?: string;
    start_date?: number; // Unix ms
    due_date?: number;   // Unix ms
  }
): Promise<{ id: string; url: string }> {
  const data = await clickupFetch<ClickUpTaskResponse>(
    `/list/${listId}/task`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return { id: data.id, url: data.url };
}
