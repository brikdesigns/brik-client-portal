import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionTimeoutProvider } from '@/components/session-timeout-provider';
import { ToastProvider } from '@/components/toast-provider';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SessionTimeoutProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionTimeoutProvider>
  );
}
