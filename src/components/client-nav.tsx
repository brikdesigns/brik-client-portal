'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

interface ClientNavProps {
  userName: string;
  clientName?: string | null;
  isAdmin?: boolean;
}

const navItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Services', href: '/dashboard/services' },
  { label: 'Payments', href: '/dashboard/payments' },
];

export function ClientNav({ userName, clientName, isAdmin }: ClientNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <header
      style={{
        backgroundColor: 'var(--_color---surface--primary)',
        borderBottom: '1px solid var(--_color---border--secondary)',
        padding: '0 32px',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/dashboard">
            <Image
              src="/images/brik-logo.svg"
              alt="Brik Designs"
              width={80}
              height={28}
              priority
              className="portal-logo"
              style={{ cursor: 'pointer' }}
            />
          </Link>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontFamily: 'var(--_typography---font-family--body)',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    color: active
                      ? 'var(--_color---text--primary)'
                      : 'var(--_color---text--secondary)',
                    backgroundColor: active
                      ? 'var(--_color---page--secondary)'
                      : 'transparent',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User info + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAdmin && (
            <Button variant="secondary" size="sm" asLink href="/admin">
              Admin
            </Button>
          )}
          <ThemeToggle />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p
              style={{
                fontFamily: 'var(--_typography---font-family--body)',
                fontSize: '13px',
                color: 'var(--_color---text--secondary)',
                margin: 0,
                fontWeight: 500,
              }}
            >
              {userName}
            </p>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
