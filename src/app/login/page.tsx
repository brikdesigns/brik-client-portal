import { Suspense } from 'react';
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
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
        {/* Logo */}
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

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--medium)',
            color: 'var(--_color---text--primary)',
            textAlign: 'center',
            marginBottom: '32px',
            fontWeight: 600,
          }}
        >
          Sign in to your account
        </h1>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
