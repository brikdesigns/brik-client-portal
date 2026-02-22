'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarNavigation, type SidebarNavItem } from '@bds/components/ui/SidebarNavigation/SidebarNavigation';
import { Button } from '@bds/components/ui/Button/Button';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { setCurrentClientIdInBrowser } from '@/lib/current-client-browser';

interface AdminSidebarProps {
  userName: string;
}

const baseNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Companies', href: '/admin/companies' },
  { label: 'Proposals', href: '/admin/proposals' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Contacts', href: '/admin/contacts' },
];

/**
 * Next.js-compatible wrapper for BDS SidebarNavigation
 *
 * Uses Next.js Link for client-side navigation and usePathname for active state.
 * Wraps the BDS SidebarNavigation component with portal-specific content.
 */
export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  // Map navigation items with active state
  const navItems: SidebarNavItem[] = baseNavItems.map((item) => ({
    ...item,
    active: isActive(item.href),
  }));

  // Brik Designs client ID (default for "View as Client")
  const BRIK_DESIGNS_ID = 'b0000000-0000-0000-0000-000000000001';

  function handleViewAsClient() {
    setCurrentClientIdInBrowser(BRIK_DESIGNS_ID);
    window.location.href = '/dashboard';
  }

  return (
    <>
      <style jsx global>{`
        /* Override BDS sidebar nav links to work with Next.js */
        aside nav a {
          cursor: pointer;
        }
      `}</style>
      <SidebarNavigation
        logo={
          <Link href="/admin">
            <Image
              src="/images/brik-logo.svg"
              alt="Brik Designs"
              width={100}
              height={35}
              priority
              className="portal-logo"
              style={{ cursor: 'pointer' }}
            />
          </Link>
        }
        navItems={navItems}
        footerActions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewAsClient}
            style={{ width: '100%' }}
          >
            View as Client
          </Button>
        }
        userSection={
          <>
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
          </>
        }
      />
    </>
  );
}
