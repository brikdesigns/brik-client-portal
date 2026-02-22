'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarNavigation, type SidebarNavItem } from '@bds/components/ui/SidebarNavigation/SidebarNavigation';
import { Button } from '@bds/components/ui/Button/Button';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ClientSwitcher } from '@/components/client-switcher';
import { setCurrentClientIdInBrowser } from '@/lib/current-client-browser';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Companies', href: '/admin/companies' },
  { label: 'Reporting', href: '/admin/reporting' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Agreements', href: '/admin/agreements' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Contacts', href: '/admin/contacts' },
];

const clientNavItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Services', href: '/dashboard/services' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'Payments', href: '/dashboard/payments' },
];

// Items managers should NOT see (admin-only sections)
const managerHiddenHrefs = ['/admin/contacts'];

interface PortalSidebarProps {
  role: 'admin' | 'client';
  portalRole?: 'admin' | 'manager' | 'client';
  userName: string;
  isAdmin?: boolean;
  clients?: Array<{ id: string; name: string }>;
  currentClientId?: string | null;
}

export function PortalSidebar({
  role,
  portalRole,
  userName,
  isAdmin = false,
  clients = [],
  currentClientId,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const allItems = role === 'admin' ? adminNavItems : clientNavItems;
  const baseItems = portalRole === 'manager'
    ? allItems.filter((item) => !managerHiddenHrefs.includes(item.href))
    : allItems;
  const homeHref = role === 'admin' ? '/admin' : '/dashboard';

  function isActive(href: string) {
    if (href === homeHref) return pathname === homeHref;
    return pathname.startsWith(href);
  }

  const navItems: SidebarNavItem[] = baseItems.map((item) => ({
    ...item,
    active: isActive(item.href),
  }));

  // Brik Designs client ID (default for "View as Client")
  const BRIK_DESIGNS_ID = 'b0000000-0000-0000-0000-000000000001';

  function handleViewAsClient() {
    setCurrentClientIdInBrowser(BRIK_DESIGNS_ID);
    window.location.href = '/dashboard';
  }

  const footerActions = role === 'admin' ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleViewAsClient}
      style={{ width: '100%' }}
    >
      View as Client
    </Button>
  ) : isAdmin ? (
    <Button
      variant="secondary"
      size="sm"
      asLink
      href="/admin"
      style={{ width: '100%' }}
    >
      Back to Admin
    </Button>
  ) : null;

  return (
    <>
      <style jsx global>{`
        aside nav a { cursor: pointer; }
      `}</style>
      <SidebarNavigation
        logo={
          <Link href={homeHref}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {role === 'client' && clients.length > 1 && (
              <ClientSwitcher
                clients={clients}
                currentClientId={currentClientId || null}
                isAdmin={isAdmin}
              />
            )}
            {footerActions}
          </div>
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
