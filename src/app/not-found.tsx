import Image from 'next/image';

export default function NotFound() {
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
          textAlign: 'center',
          fontFamily: 'var(--_typography---font-family--body)',
        }}
      >
        <Image
          src="/images/brik-logo.svg"
          alt="Brik Designs"
          width={100}
          height={35}
          style={{ marginBottom: '32px' }}
          className="portal-logo"
        />
        <h1
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--large, 28px)',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 8px',
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--_color---text--secondary)',
            marginBottom: '24px',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          style={{
            color: 'var(--_color---system--link, #0034ea)',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Go home
        </a>
      </div>
    </main>
  );
}
