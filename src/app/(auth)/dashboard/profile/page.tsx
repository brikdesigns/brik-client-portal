import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { PageHeader } from '@/components/page-header';
import { RoleTag } from '@/components/status-badges';
import { font, color, gap } from '@/lib/tokens';

export default async function ClientProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, role, is_active,
      created_at, last_login_at,
      companies(id, name, slug)
    `)
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/dashboard');
  }

  const company = profile.companies as unknown as { id: string; name: string; slug: string } | null;

  const fieldLabelStyle = {
    fontFamily: font.family.label,
    fontSize: font.size.body.sm,
    fontWeight: font.weight.semibold,
    color: color.text.muted,
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.primary,
    margin: 0,
  };

  const formatDateTime = (date: string | null) =>
    date ? new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  return (
    <div>
      <PageHeader
        title={profile.full_name || profile.email}
        subtitle={profile.full_name ? profile.email : undefined}
        metadata={[
          { label: 'Role', value: <RoleTag role={profile.role} /> },
          {
            label: 'Status',
            value: (
              <Badge status={profile.is_active ? 'positive' : 'warning'}>
                {profile.is_active ? 'Active' : 'Disabled'}
              </Badge>
            ),
          },
          ...(company ? [{ label: 'Company', value: company.name }] : []),
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Email</p>
            <p style={fieldValueStyle}>{profile.email}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Company</p>
            <p style={fieldValueStyle}>{company?.name || '—'}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Last login</p>
            <p style={fieldValueStyle}>{formatDateTime(profile.last_login_at)}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Account created</p>
            <p style={fieldValueStyle}>
              {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
