import type { Metadata } from 'next';
import Image from 'next/image';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { font, color, space, gap, border, shadow } from '@/lib/tokens';

export const metadata: Metadata = {
  title: 'Forgot Password — Brik Client Portal',
};

export default function ForgotPasswordPage() {
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

        <h1
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.medium,
            color: color.text.primary,
            textAlign: 'center',
            marginBottom: gap.xs,
            fontWeight: font.weight.semibold,
          }}
        >
          Reset your password
        </h1>
        <p
          style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            textAlign: 'center',
            marginBottom: space.xl,
          }}
        >
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
