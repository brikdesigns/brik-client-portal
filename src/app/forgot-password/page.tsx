import Image from 'next/image';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export default function ForgotPasswordPage() {
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
          backgroundColor: 'var(--_color---surface--primary, white)',
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
            className="portal-logo"
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
          Reset your password
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
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
