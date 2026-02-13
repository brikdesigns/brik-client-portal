import Image from 'next/image';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--_color---page--accent, #f1f0ec)',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '48px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--_box-shadow---md)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image
            src="/images/brik-logo.svg"
            alt="Brik Designs"
            width={130}
            height={45}
            priority
          />
        </div>

        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--medium)',
            color: 'var(--_color---text--primary)',
            textAlign: 'center',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          Set a new password
        </h1>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: 'var(--_typography---body--md-base, 14px)',
            color: 'var(--_color---text--secondary)',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          Choose a strong password for your account.
        </p>

        <ResetPasswordForm />
      </div>
    </main>
  );
}
