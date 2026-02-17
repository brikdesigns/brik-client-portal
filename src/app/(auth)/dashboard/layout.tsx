import { createClient } from '@/lib/supabase/server';
import { ClientNav } from '@/components/client-nav';
import { getCurrentClientId, getUserClients } from '@/lib/current-client';

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

  // Get current client name for display
  const currentClient = clients.find((c) => c.id === currentClientId);
  const clientName = currentClient?.name;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--_color---page--secondary, #f2f2f2)' }}>
      <ClientNav
        userName={profile?.full_name || user!.email || 'User'}
        clientName={clientName}
        isAdmin={profile?.role === 'admin'}
        clients={clients}
        currentClientId={currentClientId}
      />
      <main
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
        className="dashboard-main"
      >
        {children}
      </main>
    </div>
  );
}
