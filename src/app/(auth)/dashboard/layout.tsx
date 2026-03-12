import { getAuthUser, isBrikAdmin } from '@/lib/auth';
import { PortalSidebar } from '@/components/portal-sidebar';
import { getCurrentClientId, getUserClients } from '@/lib/current-client';
import { color, space } from '@/lib/tokens';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const { user } = authUser;

  // Get current client from cookie and available clients
  const currentClientId = await getCurrentClientId(user.id);
  const clients = await getUserClients(user.id);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <PortalSidebar
        role="client"
        userId={user.id}
        isAdmin={isBrikAdmin(authUser)}
        clients={clients}
        currentClientId={currentClientId}
      />
      <main
        style={{
          flex: 1,
          backgroundColor: color.page.primary,
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
