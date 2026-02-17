import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PortalSidebar } from '@/components/portal-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <PortalSidebar
        role="admin"
        userName={profile?.full_name || user.email || 'Admin'}
        isAdmin
      />
      <main
        style={{
          flex: 1,
          backgroundColor: 'var(--_color---page--secondary, #f2f2f2)',
          padding: '32px',
          marginLeft: '260px',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
}
