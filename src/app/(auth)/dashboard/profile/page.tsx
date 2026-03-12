import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { PageHeader } from '@/components/page-header';
import { RoleTag } from '@/components/status-badges';
import { gap } from '@/lib/tokens';
import { detail } from '@/lib/styles';

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, full_name, email, role, is_active,
      created_at, last_login_at,
      companies(id, name, slug)
    `)
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/dashboard');
  }

  const company = profile.companies as unknown as { id: string; name: string; slug: string } | null;

  const fieldLabelStyle = detail.label;
  const fieldValueStyle = detail.value;

  const formatDateTime = (date: string | null) =>
    date ? new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  return (
    <div>
      <PageHeader
        title={profile.full_name || profile.email}
        subtitle={profile.full_name ? profile.email : undefined}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        <div style={detail.grid}>
          <div>
            <p style={fieldLabelStyle}>Role</p>
            <p style={fieldValueStyle}><RoleTag role={profile.role} /></p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Status</p>
            <p style={fieldValueStyle}>
              <Badge status={profile.is_active ? 'positive' : 'warning'}>
                {profile.is_active ? 'Active' : 'Disabled'}
              </Badge>
            </p>
          </div>
          {company && (
            <div>
              <p style={fieldLabelStyle}>Company</p>
              <p style={fieldValueStyle}>{company.name}</p>
            </div>
          )}
        </div>
        <div style={detail.grid}>
          <div>
            <p style={fieldLabelStyle}>Email</p>
            <p style={fieldValueStyle}>{profile.email}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Last login</p>
            <p style={fieldValueStyle}>{formatDateTime(profile.last_login_at)}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Account created</p>
            <p style={fieldValueStyle}>
              {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
