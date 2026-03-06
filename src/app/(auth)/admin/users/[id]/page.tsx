import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { RoleTag } from '@/components/status-badges';
import { heading } from '@/lib/styles';
import { font, color, space } from '@/lib/tokens';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      is_active,
      company_id,
      invited_at,
      invited_by,
      last_login_at,
      created_at,
      updated_at,
      companies(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !user) {
    notFound();
  }

  const client = user.companies as unknown as { id: string; name: string; slug: string } | null;

  // Look up who invited this user
  let invitedByName: string | null = null;
  if (user.invited_by) {
    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.invited_by)
      .single();
    invitedByName = inviter?.full_name || inviter?.email || null;
  }

  const fieldStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    color: color.text.primary,
    margin: 0,
  };

  const labelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.sm,
    color: color.text.muted,
    margin: '0 0 4px',
  };

  const sectionHeadingStyle = heading.section;

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatDateTime = (date: string | null) =>
    date ? new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  return (
    <div>
      <PageHeader
        title={user.full_name || user.email}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Users', href: '/admin/users' },
              { label: user.full_name || user.email },
            ]}
          />
        }
        subtitle={user.full_name ? user.email : undefined}
        metadata={[
          { label: 'Role', value: <RoleTag role={user.role} /> },
          {
            label: 'Status',
            value: (
              <Badge status={user.is_active ? 'positive' : 'warning'}>
                {user.is_active ? 'Active' : 'Disabled'}
              </Badge>
            ),
          },
          {
            label: 'Client',
            value: client ? (
              <a
                href={`/admin/companies/${client.slug}`}
                style={{ color: color.system.link, textDecoration: 'none' }}
              >
                {client.name}
              </a>
            ) : '—',
          },
          { label: 'Last login', value: formatDateTime(user.last_login_at) },
        ]}
        actions={
          <Link href={`/admin/users/${id}/edit`}>
            <Button variant="secondary" size="md">
              Edit
            </Button>
          </Link>
        }
      />

      {/* Activity */}
      <Card variant="elevated" padding="lg">
        <h2 style={sectionHeadingStyle}>Activity</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: space.lg,
          }}
        >
          <div>
            <p style={labelStyle}>Last login</p>
            <p style={fieldStyle}>{formatDateTime(user.last_login_at)}</p>
          </div>
          <div>
            <p style={labelStyle}>Invited</p>
            <p style={fieldStyle}>{formatDate(user.invited_at)}</p>
          </div>
          <div>
            <p style={labelStyle}>Invited by</p>
            <p style={fieldStyle}>{invitedByName || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Account created</p>
            <p style={fieldStyle}>{formatDate(user.created_at)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
