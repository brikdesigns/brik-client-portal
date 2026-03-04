import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionTimeoutProvider } from '@/components/session-timeout-provider';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <SessionTimeoutProvider>{children}</SessionTimeoutProvider>;
}
