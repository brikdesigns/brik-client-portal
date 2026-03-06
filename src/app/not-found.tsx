import Image from 'next/image';
import { font, color, space, gap } from '@/lib/tokens';

export default function NotFound() {
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
          textAlign: 'center',
          fontFamily: font.family.body,
        }}
      >
        <Image
          src="/images/brik-logo.svg"
          alt="Brik Designs"
          width={100}
          height={35}
          style={{ marginBottom: space.xl }}
          className="portal-logo"
        />
        <h1
          style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.large,
            fontWeight: font.weight.semibold,
            color: color.text.primary,
            margin: `0 0 ${gap.xs}`,
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: font.size.body.sm,
            color: color.text.secondary,
            marginBottom: space.lg,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          style={{
            color: color.system.link,
            fontSize: font.size.body.sm,
            textDecoration: 'none',
          }}
        >
          Go home
        </a>
      </div>
    </main>
  );
}
