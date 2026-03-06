import { Suspense } from 'react';
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { font, color, space, border, shadow } from '@/lib/tokens';

export default function LoginPage() {
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
        {/* Logo */}
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

        {/* Heading */}
        <h1
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.medium,
            color: color.text.primary,
            textAlign: 'center',
            marginBottom: space.xl,
            fontWeight: font.weight.semibold,
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
