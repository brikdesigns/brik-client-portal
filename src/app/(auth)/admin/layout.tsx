import { redirect } from 'next/navigation';
import { getAuthUser, isBrikAdmin } from '@/lib/auth';
import { PortalSidebar } from '@/components/portal-sidebar';
import { color, space } from '@/lib/tokens';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  if (!isBrikAdmin(authUser)) {
    redirect('/dashboard');
  }

  const { user } = authUser;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <PortalSidebar
        role="admin"
        userId={user.id}
        isAdmin
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
