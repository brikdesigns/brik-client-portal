'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

interface AdminSidebarProps {
  userName: string;
}

const navItems = [
  { label: 'Overview', href: '/admin', icon: '&#9632;' },
  { label: 'Clients', href: '/admin/clients', icon: '&#9632;' },
  { label: 'Services', href: '/admin/services', icon: '&#9632;' },
  { label: 'Invoices', href: '/admin/invoices', icon: '&#9632;' },
  { label: 'Users', href: '/admin/users', icon: '&#9632;' },
];

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--_color---surface--primary)',
        borderRight: '1px solid var(--_color---border--secondary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--_color---border--secondary)',
        }}
      >
        <Image
          src="/images/brik-logo.svg"
          alt="Brik Designs"
          width={100}
          height={35}
          priority
          className="portal-logo"
        />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
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
                marginBottom: '4px',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: active
                    ? 'var(--brand--primary)'
                    : 'var(--_color---border--secondary)',
                  flexShrink: 0,
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* View Client Portal */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--_color---border--secondary)',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          asLink
          href="/dashboard"
          style={{ width: '100%' }}
        >
          View as Client
        </Button>
      </div>

      {/* User & Sign out */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--_color---border--secondary)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '13px',
            color: 'var(--_color---text--secondary)',
            margin: '0 0 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SignOutButton />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
