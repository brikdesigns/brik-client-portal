'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

interface AdminSidebarProps {
  userName: string;
}

const navItems = [
  { label: 'Overview', href: '/admin', icon: '&#9632;' },
  { label: 'Clients', href: '/admin/clients', icon: '&#9632;' },
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
        backgroundColor: 'var(--_color---surface--primary, white)',
        borderRight: '1px solid var(--_color---border--secondary, #e0e0e0)',
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
          borderBottom: '1px solid var(--_color---border--secondary, #e0e0e0)',
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
            <a
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
                  ? 'var(--_color---text--primary, #1b1b1b)'
                  : 'var(--_color---text--secondary, #828282)',
                backgroundColor: active
                  ? 'var(--_color---page--secondary, #f2f2f2)'
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
                    ? 'var(--brand--primary, #e35335)'
                    : 'var(--_color---border--secondary, #e0e0e0)',
                  flexShrink: 0,
                }}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User & Sign out */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--_color---border--secondary, #e0e0e0)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--body)',
            fontSize: '13px',
            color: 'var(--_color---text--secondary, #828282)',
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
