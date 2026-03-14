'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';
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
  email_sent: 'Email sent',
  email_delivered: 'Email delivered',
  email_bounced: 'Email bounced',
  email_failed: 'Email failed',
};

const eventBadgeStatus: Record<string, 'positive' | 'error' | 'neutral' | 'warning'> = {
  login: 'positive',
  logout: 'neutral',
  password_reset: 'neutral',
  invite_accepted: 'positive',
  email_sent: 'neutral',
  email_delivered: 'positive',
  email_bounced: 'error',
  email_failed: 'error',
};

const emailTemplateLabels: Record<string, string> = {
  invite: 'Portal invite',
  proposal_sent: 'Proposal link',
  invoice_due: 'Invoice reminder',
  password_reset: 'Password reset',
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

interface EmailEntry {
  id: string;
  to_email: string;
  subject: string;
  template: string | null;
  status: string;
  sent_at: string;
}

/** Unified timeline entry for the Activity tab */
interface TimelineEntry {
  id: string;
  event_type: string;
  detail: string | null;
  date: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface Props {
  contact: Contact;
  company: { id: string; name: string; slug: string; type: string } | null;
  profile: Profile | null;
  connectedCompanies: ConnectedCompany[];
  activity: ActivityEntry[];
  emails: EmailEntry[];
}

/** Merge auth activity + emails into a single timeline sorted by date desc */
function buildTimeline(activity: ActivityEntry[], emails: EmailEntry[]): TimelineEntry[] {
  const authEntries: TimelineEntry[] = activity.map((a) => ({
    id: a.id,
    event_type: a.event_type,
    detail: null,
    date: a.created_at,
    ip_address: a.ip_address,
    user_agent: a.user_agent,
  }));

  const emailEntries: TimelineEntry[] = emails.map((e) => ({
    id: `email-${e.id}`,
    event_type: `email_${e.status}`,
    detail: e.template
      ? emailTemplateLabels[e.template] ?? e.template
      : e.subject,
    date: e.sent_at,
    ip_address: null,
    user_agent: null,
  }));

  return [...authEntries, ...emailEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function ContactDetailTabs({ contact, company, profile, connectedCompanies, activity, emails }: Props) {
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
              <p style={detail.label}>User Type</p>
              <p style={detail.value}>
                {profile ? (
                  <Tag size="sm">{userTypeLabel}</Tag>
                ) : (
                  <span style={detail.empty}>No portal access</span>
                )}
              </p>
            </div>
            <div>
              <p style={detail.label}>User Status</p>
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
              <p style={detail.label}>Last Login</p>
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
              <p style={detail.label}>Date Added</p>
              <p style={detail.value}>
                {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p style={detail.label}>Last Updated</p>
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
              <p style={detail.label}>Job Title</p>
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
                <LinkButton variant="secondary" size="sm" href={`/admin/companies/${c.slug}`}>
                  View
                </LinkButton>
              ),
              style: { textAlign: 'right' },
            },
          ]}
        />
      )}

      {/* ── Activity Tab ──────────────────────────────────────── */}
      {activeTab === 'activity' && (() => {
        const hasPortalAccess = !!contact.user_id;
        const hasEmails = emails.length > 0;

        if (!hasPortalAccess && !hasEmails) {
          return (
            <p style={{ ...detail.value, color: color.text.muted }}>
              No activity recorded yet. Activity will appear here when the contact receives emails or logs into the portal.
            </p>
          );
        }

        const timeline = buildTimeline(
          hasPortalAccess ? activity : [],
          emails,
        );

        return (
          <DataTable
            data={timeline}
            rowKey={(t) => t.id}
            emptyMessage="No activity recorded yet"
            emptyDescription="Activity events will appear here as the user interacts with the portal."
            columns={[
              {
                header: 'Event',
                accessor: (t) => (
                  <Badge status={eventBadgeStatus[t.event_type] ?? 'neutral'}>
                    {eventTypeLabels[t.event_type] ?? t.event_type}
                  </Badge>
                ),
              },
              {
                header: 'Detail',
                accessor: (t) => t.detail || '—',
                style: { color: color.text.secondary },
              },
              {
                header: 'Date',
                accessor: (t) => new Date(t.date).toLocaleString(),
                style: { color: color.text.secondary },
              },
              {
                header: 'IP Address',
                accessor: (t) => t.ip_address || '—',
                style: { color: color.text.muted },
              },
              {
                header: 'Device',
                accessor: (t) => {
                  if (!t.user_agent) return '—';
                  if (t.user_agent.includes('Mobile')) return 'Mobile';
                  if (t.user_agent.includes('Mac')) return 'Mac';
                  if (t.user_agent.includes('Windows')) return 'Windows';
                  if (t.user_agent.includes('Linux')) return 'Linux';
                  return 'Desktop';
                },
                style: { color: color.text.muted },
              },
            ]}
          />
        );
      })()}
    </>
  );
}
