import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { font, color, space, gap, border, shadow } from '@/lib/tokens';
import { WelcomeSetupForm } from '@/components/welcome-setup-form';

interface WelcomePageProps {
  params: Promise<{ token: string }>;
}

async function getContactByToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contact } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, setup_token_expires_at, setup_completed_at, companies(name)')
    .eq('setup_token', token)
    .single();

  return contact;
}

export default async function WelcomePage(props: WelcomePageProps) {
  const params = await props.params;
  const contact = await getContactByToken(params.token);

  // Token not found
  if (!contact) {
    return (
      <WelcomeShell>
        <h1 style={styles.heading}>Link not found</h1>
        <p style={styles.subtext}>
          This setup link is invalid or has already been used. If you need a new
          link, please contact your Brik team.
        </p>
      </WelcomeShell>
    );
  }

  // Already set up
  if (contact.setup_completed_at) {
    return (
      <WelcomeShell>
        <h1 style={styles.heading}>Account already set up</h1>
        <p style={styles.subtext}>
          Your account is ready to go. Sign in to access your portal.
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: space.lg,
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.brand,
            textDecoration: 'none',
          }}
        >
          Go to sign in →
        </a>
      </WelcomeShell>
    );
  }

  // Expired
  const expiresAt = contact.setup_token_expires_at
    ? new Date(contact.setup_token_expires_at)
    : null;
  if (expiresAt && expiresAt < new Date()) {
    return (
      <WelcomeShell>
        <h1 style={styles.heading}>Link expired</h1>
        <p style={styles.subtext}>
          This setup link has expired. Please contact your Brik team to get a
          new one.
        </p>
      </WelcomeShell>
    );
  }

  const company = contact.companies as unknown as { name: string } | null;

  return (
    <WelcomeShell>
      <h1 style={styles.heading}>
        Welcome{contact.first_name ? `, ${contact.first_name}` : ''}
      </h1>
      <p style={styles.subtext}>
        Set up your account to access the {company?.name ?? 'Brik'} portal.
      </p>
      <WelcomeSetupForm
        token={params.token}
        contactEmail={contact.email ?? ''}
        contactFirstName={contact.first_name ?? ''}
        contactLastName={contact.last_name ?? ''}
      />
    </WelcomeShell>
  );
}

function WelcomeShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.page.accent,
      }}
    >
      <div
        style={{
          backgroundColor: color.surface.primary,
          borderRadius: border.radius.md,
          padding: space.huge,
          width: '100%',
          maxWidth: '420px',
          boxShadow: shadow.md,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: space.xl }}>
          <Image
            src="/images/brik-logo.svg"
            alt="Brik Designs"
            width={130}
            height={45}
            priority
            className="portal-logo"
          />
        </div>
        <div style={{ textAlign: 'center' }}>{children}</div>
      </div>
    </main>
  );
}

const styles = {
  heading: {
    fontFamily: font.family.heading,
    fontSize: font.size.heading.medium,
    color: color.text.primary,
    marginBottom: gap.xs,
    fontWeight: font.weight.semibold,
  } as React.CSSProperties,
  subtext: {
    fontFamily: font.family.body,
    fontSize: font.size.body.md,
    color: color.text.secondary,
    marginBottom: space.xl,
    lineHeight: font.lineHeight.relaxed,
  } as React.CSSProperties,
};
