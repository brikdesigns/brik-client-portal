import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Button } from '@bds/components/ui/Button/Button';
import { Link } from '@bds/components/ui/Link/Link';
import { PageHeader } from '@/components/page-header';
import { RoleTag } from '@/components/status-badges';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      is_active,
      client_id,
      invited_at,
      invited_by,
      last_login_at,
      created_at,
      updated_at,
      clients(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !user) {
    notFound();
  }

  const client = user.clients as unknown as { id: string; name: string; slug: string } | null;

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
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: 'var(--_typography---body--md, 16px)',
    color: 'var(--_color---text--primary)',
    margin: 0,
  };

  const labelStyle = {
    fontFamily: 'var(--_typography---font-family--label)',
    fontSize: 'var(--_typography---body--sm, 14px)',
    color: 'var(--_color---text--muted)',
    margin: '0 0 4px',
  };

  const sectionHeadingStyle = {
    fontFamily: 'var(--_typography---font-family--heading)',
    fontSize: 'var(--_typography---heading--small, 18px)',
    fontWeight: 600,
    color: 'var(--_color---text--primary)',
    margin: '0 0 16px',
  };

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatDateTime = (date: string | null) =>
    date ? new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  return (
    <div>
      <PageHeader
        title={user.full_name || user.email}
        badge={<RoleTag role={user.role} />}
        subtitle={user.full_name ? user.email : undefined}
        action={
          <Link href="/admin/users" size="small">
            Back to users
          </Link>
        }
      />

      {/* Profile info */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <h2 style={sectionHeadingStyle}>Profile</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
          }}
        >
          <div>
            <p style={labelStyle}>Full name</p>
            <p style={fieldStyle}>{user.full_name || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Email</p>
            <p style={fieldStyle}>{user.email}</p>
          </div>
          <div>
            <p style={labelStyle}>Role</p>
            <div style={{ marginTop: '2px' }}><RoleTag role={user.role} /></div>
          </div>
          <div>
            <p style={labelStyle}>Status</p>
            <div style={{ marginTop: '2px' }}>
              <Badge status={user.is_active ? 'positive' : 'warning'}>
                {user.is_active ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Client assignment */}
      {user.role === 'client' && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <h2 style={sectionHeadingStyle}>Client assignment</h2>
          {client ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={fieldStyle}>{client.name}</p>
              <Button variant="secondary" size="sm" asLink href={`/admin/clients/${client.slug}`}>
                View Details
              </Button>
            </div>
          ) : (
            <p style={{ ...fieldStyle, color: 'var(--_color---text--muted)' }}>
              No client assigned
            </p>
          )}
        </Card>
      )}

      {/* Activity */}
      <Card variant="elevated" padding="lg">
        <h2 style={sectionHeadingStyle}>Activity</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
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
