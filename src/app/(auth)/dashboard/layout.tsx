import { createClient } from '@/lib/supabase/server';
import { ClientNav } from '@/components/client-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, clients(name)')
    .eq('id', user!.id)
    .single();

  const clientName = (profile?.clients as unknown as { name: string } | null)?.name;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--_color---page--secondary, #f2f2f2)' }}>
      <ClientNav
        userName={profile?.full_name || user!.email || 'User'}
        clientName={clientName}
        isAdmin={profile?.role === 'admin'}
      />
      <main style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
