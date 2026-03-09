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
import { font, color, gap } from '@/lib/tokens';

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Companies', href: '/admin/companies' },
  { label: 'Contacts', href: '/admin/contacts' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Billing', href: '/admin/invoices' },
  { label: 'Reporting', href: '/admin/reporting' },
];

const clientNavItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Services', href: '/dashboard/services' },
  { label: 'Projects', href: '/dashboard/projects' },
  { label: 'Payments', href: '/dashboard/payments' },
];

interface PortalSidebarProps {
  role: 'admin' | 'client';
  userId: string;
  userName: string;
  isAdmin?: boolean;
  clients?: Array<{ id: string; name: string }>;
  currentClientId?: string | null;
}

export function PortalSidebar({
  role,
  userId,
  userName,
  isAdmin = false,
  clients = [],
  currentClientId,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const allItems = role === 'admin' ? adminNavItems : clientNavItems;
  const baseItems = allItems;
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
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
            <Link
              href={role === 'admin' ? `/admin/users/${userId}` : `/dashboard/profile`}
              style={{
                fontFamily: font.family.body,
                fontSize: font.size.body.xs,
                color: color.text.secondary,
                margin: `0 0 ${gap.xs}`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              {userName}
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
              <SignOutButton />
              <ThemeToggle />
            </div>
          </>
        }
      />
    </>
  );
}
