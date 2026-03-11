import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { ContactTabs } from '@/components/contact-tabs';
import { CompanyTypeTag } from '@/components/status-badges';
import { font, color, gap, space } from '@/lib/tokens';
import { detail, heading } from '@/lib/styles';
import { formatPhone, formatContactRole } from '@/lib/format';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ContactDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      title,
      role,
      is_primary,
      user_id,
      notes,
      created_at,
      updated_at,
      companies(id, name, slug, type)
    `)
    .eq('id', id)
    .single();

  if (error || !contact) {
    notFound();
  }

  const company = contact.companies as unknown as { id: string; name: string; slug: string; type: string } | null;

  // Fetch profile data for User Type and User Status (only if contact has portal access)
  let profile: { role: string; is_active: boolean; last_login_at: string | null } | null = null;
  if (contact.user_id) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_active, last_login_at')
      .eq('id', contact.user_id)
      .single();
    profile = data;
  }

  // Fetch companies connected via company_users (for Companies tab)
  let connectedCompanies: { id: string; name: string; slug: string; type: string; role: string }[] = [];
  if (contact.user_id) {
    const { data } = await supabase
      .from('company_users')
      .select('role, companies(id, name, slug, type)')
      .eq('user_id', contact.user_id);

    connectedCompanies = (data ?? []).map((cu) => {
      const comp = cu.companies as unknown as { id: string; name: string; slug: string; type: string };
      return { ...comp, role: cu.role };
    });
  }

  // If no company_users entries, fall back to the contact's own company
  if (connectedCompanies.length === 0 && company) {
    connectedCompanies = [{ ...company, role: contact.role }];
  }

  // Fetch login activity (for Activity tab)
  let activity: { id: string; event_type: string; ip_address: string | null; user_agent: string | null; created_at: string }[] = [];
  if (contact.user_id) {
    const { data } = await supabase
      .from('user_activity')
      .select('id, event_type, ip_address, user_agent, created_at')
      .eq('user_id', contact.user_id)
      .order('created_at', { ascending: false })
      .limit(50);
    activity = data ?? [];
  }

  const activeTab = tab && ['overview', 'companies', 'activity'].includes(tab) ? tab : 'overview';

  const userTypeLabel = profile?.role === 'super_admin' ? 'Brik Admin' : 'Client';
  const userIsActive = profile?.is_active ?? false;

  const eventTypeLabels: Record<string, string> = {
    login: 'Login',
    logout: 'Logout',
    password_reset: 'Password reset',
    invite_accepted: 'Invite accepted',
  };

  return (
    <div>
      <PageHeader
        title={contact.full_name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Contacts', href: '/admin/contacts' },
              { label: contact.full_name },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: gap.md }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${contact.id}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={[]}
      />

      {/* Tabs */}
      <div style={{ marginBottom: space.lg }}>
        <ContactTabs contactId={contact.id} />
      </div>

      {/* ── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
          {/* User type + status row (portal access info) */}
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
        <div>
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
        </div>
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
                    // Show a simplified device string
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
    </div>
  );
}
