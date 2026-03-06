import { createClient } from '@/lib/supabase/server';
import { PortalSidebar } from '@/components/portal-sidebar';
import { getCurrentClientId, getUserClients } from '@/lib/current-client';
import { color, space } from '@/lib/tokens';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single();

  // Get current client from cookie and available clients
  const currentClientId = await getCurrentClientId(user!.id);
  const clients = await getUserClients(user!.id);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <PortalSidebar
        role="client"
        userName={profile?.full_name || user!.email || 'User'}
        isAdmin={profile?.role === 'admin'}
        clients={clients}
        currentClientId={currentClientId}
      />
      <main
        style={{
          flex: 1,
          backgroundColor: color.page.secondary,
          padding: space.xl,
          marginLeft: '260px',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
}
