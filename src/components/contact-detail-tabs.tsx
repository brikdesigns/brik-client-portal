'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { DataTable } from '@/components/data-table';
import { CompanyTypeTag } from '@/components/status-badges';
import { font, color, gap, space, border } from '@/lib/tokens';
import { detail } from '@/lib/styles';
import { formatPhone, formatContactRole } from '@/lib/format';

const tabDefs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Companies', value: 'companies' },
  { label: 'Activity', value: 'activity' },
];

const tabStyle = (active: boolean) => ({
  fontFamily: font.family.label,
  fontSize: font.size.body.md,
  fontWeight: font.weight.medium,
  color: active ? color.text.brand : color.text.muted,
  textDecoration: 'none' as const,
  padding: `${gap.sm} 0`,
  background: 'none',
  border: 'none',
  borderBottom: active
    ? `${border.width.lg} solid ${color.text.brand}`
    : `${border.width.lg} solid transparent`,
  marginBottom: `calc(-1 * ${border.width.md})`,
  cursor: 'pointer' as const,
});

const eventTypeLabels: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  password_reset: 'Password reset',
  invite_accepted: 'Invite accepted',
};

interface Contact {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string;
  is_primary: boolean;
  user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

interface ConnectedCompany {
  id: string;
  name: string;
  slug: string;
  type: string;
  role: string;
}

interface ActivityEntry {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Props {
  contact: Contact;
  company: { id: string; name: string; slug: string; type: string } | null;
  profile: Profile | null;
  connectedCompanies: ConnectedCompany[];
  activity: ActivityEntry[];
}

export function ContactDetailTabs({ contact, company, profile, connectedCompanies, activity }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab');
  const activeTab = tab && ['overview', 'companies', 'activity'].includes(tab) ? tab : 'overview';

  const userTypeLabel = profile?.role === 'super_admin' ? 'Brik Admin' : 'Client';
  const userIsActive = profile?.is_active ?? false;

  function switchTab(value: string) {
    const url = value === 'overview'
      ? `/admin/contacts/${contact.id}`
      : `/admin/contacts/${contact.id}?tab=${value}`;
    router.push(url, { scroll: false });
  }

  return (
    <>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: gap.xl,
          borderBottom: `${border.width.md} solid ${color.border.muted}`,
          marginBottom: space.lg,
        }}
      >
        {tabDefs.map((t) => (
          <button
            key={t.value}
            style={tabStyle(activeTab === t.value)}
            onClick={() => switchTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          {/* User type + status row */}
          <div style={detail.grid}>
            <div>
              <p style={detail.label}>User type</p>
              <p style={detail.value}>
                {profile ? (
                  <Tag size="sm">{userTypeLabel}</Tag>
                ) : (
                  <span style={detail.empty}>No portal access</span>
                )}
              </p>
            </div>
            <div>
              <p style={detail.label}>User status</p>
              <p style={detail.value}>
                {profile ? (
                  <Badge status={userIsActive ? 'positive' : 'neutral'}>
                    {userIsActive ? 'Active' : 'Inactive'}
                  </Badge>
                ) : (
                  <span style={detail.empty}>—</span>
                )}
              </p>
            </div>
            <div>
              <p style={detail.label}>Last login</p>
              <p style={detail.value}>
                {profile?.last_login_at
                  ? new Date(profile.last_login_at).toLocaleDateString()
                  : <span style={detail.empty}>—</span>
                }
              </p>
            </div>
          </div>

          {/* Role + dates row */}
          <div style={detail.grid}>
            <div>
              <p style={detail.label}>Role</p>
              <p style={{ ...detail.value, display: 'flex', alignItems: 'center', gap: gap.sm }}>
                {formatContactRole(contact.role)}
                {contact.is_primary && <Tag size="sm">Primary</Tag>}
              </p>
            </div>
            <div>
              <p style={detail.label}>Date added</p>
              <p style={detail.value}>
                {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p style={detail.label}>Last updated</p>
              <p style={detail.value}>
                {new Date(contact.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Company */}
          <div>
            <p style={detail.label}>Company</p>
            <p style={detail.value}>
              {company ? (
                <TextLink href={`/admin/companies/${company.slug}`} size="small">
                  {company.name}
                </TextLink>
              ) : '—'}
            </p>
          </div>

          {/* Contact info grid */}
          <div style={detail.grid}>
            <div>
              <p style={detail.label}>Email</p>
              <p style={detail.value}>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} style={detail.link}>
                    {contact.email}
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={detail.label}>Phone</p>
              <p style={detail.value}>{contact.phone ? formatPhone(contact.phone) : '—'}</p>
            </div>
            <div>
              <p style={detail.label}>Job title</p>
              <p style={detail.value}>{contact.title || '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div>
              <p style={detail.label}>Notes</p>
              <p
                style={{
                  ...detail.value,
                  color: color.text.secondary,
                  lineHeight: font.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {contact.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Companies Tab ─────────────────────────────────────── */}
      {activeTab === 'companies' && (
        <DataTable
          data={connectedCompanies}
          rowKey={(c) => c.id}
          emptyMessage="No companies connected"
          emptyDescription="Link this contact to a company from their detail page."
          columns={[
            {
              header: 'Company',
              accessor: (c) => (
                <TextLink href={`/admin/companies/${c.slug}`} size="small">
                  {c.name}
                </TextLink>
              ),
              style: { fontWeight: font.weight.medium },
            },
            {
              header: 'Type',
              accessor: (c) => <CompanyTypeTag type={c.type} />,
            },
            {
              header: 'Role',
              accessor: (c) => (
                <Tag size="sm" style={{ color: color.text.muted }}>
                  {formatContactRole(c.role)}
                </Tag>
              ),
            },
            {
              header: '',
              accessor: (c) => (
                <Button variant="secondary" size="sm" asLink href={`/admin/companies/${c.slug}`}>
                  View
                </Button>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      )}

      {/* ── Activity Tab ──────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div>
          {!contact.user_id ? (
            <p style={{ ...detail.value, color: color.text.muted }}>
              This contact does not have portal access. Activity tracking requires a linked user account.
            </p>
          ) : (
            <DataTable
              data={activity}
              rowKey={(a) => a.id}
              emptyMessage="No activity recorded yet"
              emptyDescription="Activity events will appear here as the user interacts with the portal."
              columns={[
                {
                  header: 'Event',
                  accessor: (a) => (
                    <Badge status={a.event_type === 'login' ? 'positive' : 'neutral'}>
                      {eventTypeLabels[a.event_type] ?? a.event_type}
                    </Badge>
                  ),
                },
                {
                  header: 'Date',
                  accessor: (a) => new Date(a.created_at).toLocaleString(),
                  style: { color: color.text.secondary },
                },
                {
                  header: 'IP address',
                  accessor: (a) => a.ip_address || '—',
                  style: { color: color.text.muted },
                },
                {
                  header: 'Device',
                  accessor: (a) => {
                    if (!a.user_agent) return '—';
                    if (a.user_agent.includes('Mobile')) return 'Mobile';
                    if (a.user_agent.includes('Mac')) return 'Mac';
                    if (a.user_agent.includes('Windows')) return 'Windows';
                    if (a.user_agent.includes('Linux')) return 'Linux';
                    return 'Desktop';
                  },
                  style: { color: color.text.muted },
                },
              ]}
            />
          )}
        </div>
      )}
    </>
  );
}
