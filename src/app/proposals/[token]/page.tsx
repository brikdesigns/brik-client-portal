'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { formatCurrency } from '@/lib/format';
import { font, color, border, space, gap } from '@/lib/tokens';

/**
 * Force dark theme on this standalone page.
 *
 * Sets data-theme="dark" on <html> so all semantic tokens (color.text.primary,
 * color.page.primary, etc.) resolve to their dark-mode CSS values. Restores
 * the previous theme on unmount so portal theme toggle isn't affected.
 */
function useForceDarkTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.dataset.theme;
    html.dataset.theme = 'dark';
    html.style.colorScheme = 'dark';
    return () => {
      if (prev) {
        html.dataset.theme = prev;
        html.style.colorScheme = prev;
      } else {
        delete html.dataset.theme;
        html.style.colorScheme = '';
      }
    };
  }, []);
}

// --- Mobile breakpoint hook ---

const MOBILE_BREAKPOINT = 768;

function subscribeMobile(cb: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSnapshotMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function getServerSnapshotMobile() {
  return false; // SSR default: desktop
}

function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getSnapshotMobile, getServerSnapshotMobile);
}

// --- Types ---

interface ProposalItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_cents: number;
  sort_order: number;
}

interface ProposalSection {
  type: string;
  title: string;
  content: string | null;
  sort_order: number;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  token: string;
  valid_until: string | null;
  total_amount_cents: number;
  accepted_at: string | null;
  accepted_by_email: string | null;
  created_at: string;
  sections: ProposalSection[] | null;
  companies: { name: string; contact_email: string | null };
  proposal_items: ProposalItem[];
}

// --- Loading skeleton ---

function ProposalSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: color.page.primary, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {!isMobile && (
        <aside style={{ ...sidebarStyle, gap: space.lg }}>
          <div>
            <Skeleton variant="rectangular" width={100} height={35} />
            <div style={{ marginTop: space.xl }}>
              <Skeleton variant="text" width={160} height={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm, marginTop: space.lg }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
                  <Skeleton variant="circular" width={22} height={22} />
                  <Skeleton variant="text" width={120} height={14} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
      <main style={isMobile ? mainMobileStyle : mainStyle}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: gap.md, marginBottom: space.xl }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" width={i === 1 ? 24 : 8} height={8} />
          ))}
        </div>
        {/* Card */}
        <div style={isMobile ? cardMobileStyle : cardStyle}>
          <Skeleton variant="text" width="60%" height={28} />
          <div style={{ marginTop: space.lg, display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="90%" height={16} />
            <Skeleton variant="text" width="95%" height={16} />
            <Skeleton variant="text" width="70%" height={16} />
          </div>
          <div style={{ marginTop: space.xl, display: 'flex', flexDirection: 'column', gap: gap.sm }}>
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="85%" height={16} />
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Main page ---

export default function PublicProposalPage() {
  const params = useParams();
  const token = params.token as string;
  const isMobile = useIsMobile();
  useForceDarkTheme();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  // Track the furthest step reached — linear navigation only allows going back
  const [highestVisited, setHighestVisited] = useState(0);

  function goToSection(index: number) {
    setActiveSection(index);
    setHighestVisited(prev => Math.max(prev, index));
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/${token}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setProposal(data.proposal);
        if (data.proposal.status === 'accepted') {
          setAccepted(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleAccept() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setAccepting(true);

    try {
      const res = await fetch(`/api/proposals/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept proposal.');
        return;
      }

      setAccepted(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <ProposalSkeleton isMobile={isMobile} />;
  }

  if (notFound || !proposal) {
    return (
      <div style={{ ...containerStyle, backgroundColor: color.page.primary, minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: `${space.huge} 0` }}>
          <h1 style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, color: color.text.primary, margin: `0 0 ${space.tiny}` }}>Proposal not found</h1>
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary, margin: 0 }}>This proposal may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const items = [...proposal.proposal_items].sort((a, b) => a.sort_order - b.sort_order);
  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const sections = (proposal.sections || []).filter(s => s.content || s.type === 'fee_summary').sort((a, b) => a.sort_order - b.sort_order);
  const hasSections = sections.length > 0;

  if (!hasSections) {
    return <SimpleFallback proposal={proposal} items={items} isExpired={!!isExpired} accepted={accepted} email={email} setEmail={setEmail} error={error} accepting={accepting} onAccept={handleAccept} />;
  }

  const currentSection = sections[activeSection];
  const isLastSection = activeSection === sections.length - 1;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: color.page.primary, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Sidebar — hidden on mobile */}
      {!isMobile && (
        <aside style={sidebarStyle}>
          <div>
            <Image
              src="/images/brik-logo-white.svg"
              alt="Brik Designs"
              width={100}
              height={35}
              priority
              style={{ marginBottom: space.xl }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/brik-logo.svg';
              }}
            />
            <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted, margin: `0 0 ${space.lg}` }}>
              Proposal for {proposal.companies.name}
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
              {sections.map((section, index) => {
                const isActive = index === activeSection;
                const isVisited = index <= highestVisited;
                const canNavigate = isVisited && !isActive;
                return (
                  <button
                    key={section.type}
                    onClick={() => canNavigate && goToSection(index)}
                    aria-disabled={!canNavigate && !isActive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: gap.md,
                      padding: `${space.xs} ${space.md}`,
                      background: 'none',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${color.brand.primary}` : '3px solid transparent',
                      cursor: canNavigate ? 'pointer' : 'default',
                      textAlign: 'left',
                      fontFamily: font.family.body,
                      fontSize: font.size.body.sm,
                      fontWeight: isActive ? font.weight.semibold : font.weight.regular,
                      color: isActive ? color.brand.primary : isVisited ? color.text.secondary : color.text.muted,
                      opacity: isVisited || isActive ? 1 : 0.5,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: border.radius.circle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: font.size.body.tiny,
                      fontWeight: font.weight.semibold,
                      backgroundColor: isActive ? color.brand.primary : isVisited ? color.border.muted : color.border.secondary,
                      color: isActive ? color.text.inverse : color.text.muted,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    {section.title}
                  </button>
                );
              })}
            </nav>
          </div>

          {proposal.valid_until && (
            <p style={{ fontFamily: font.family.body, fontSize: font.size.body.tiny, color: color.text.muted, marginTop: 'auto' }}>
              Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </aside>
      )}

      {/* Mobile header */}
      {isMobile && (
        <div style={{ padding: `${space.lg} ${space.md}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image
            src="/images/brik-logo-white.svg"
            alt="Brik Designs"
            width={80}
            height={28}
            priority
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/brik-logo.svg';
            }}
          />
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted, margin: 0 }}>
            {proposal.companies.name}
          </p>
        </div>
      )}

      {/* Main content */}
      <main style={isMobile ? mainMobileStyle : mainStyle}>
        {/* Page dots — linear: only visited dots are clickable */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: gap.md, marginBottom: isMobile ? space.lg : space.xl }}>
          {sections.map((_, index) => {
            const isActive = index === activeSection;
            const isVisited = index <= highestVisited;
            const canNavigate = isVisited && !isActive;
            return (
              <button
                key={index}
                onClick={() => canNavigate && goToSection(index)}
                style={{
                  width: isActive ? '24px' : '8px',
                  height: '8px',
                  borderRadius: border.radius.sm,
                  backgroundColor: isActive ? color.brand.primary : isVisited ? color.border.muted : color.border.secondary,
                  border: 'none',
                  cursor: canNavigate ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={`Go to section ${index + 1}`}
                aria-disabled={!canNavigate}
              />
            );
          })}
        </div>

        {/* Content card */}
        <div style={isMobile ? cardMobileStyle : cardStyle}>
          <h1 style={{ fontFamily: font.family.heading, fontSize: isMobile ? font.size.heading.small : font.size.heading.medium, fontWeight: font.weight.semibold, color: color.text.primary, margin: `0 0 ${space.lg}` }}>
            {currentSection.title}
          </h1>

          {currentSection.type === 'fee_summary' ? (
            <FeeSummaryContent
              items={items}
              total={proposal.total_amount_cents}
              accepted={accepted}
              isExpired={!!isExpired}
              email={email}
              setEmail={setEmail}
              error={error}
              accepting={accepting}
              onAccept={handleAccept}
            />
          ) : (
            <div style={proseStyle}>
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 style={{ fontSize: font.size.body.lg, fontWeight: font.weight.semibold, color: color.text.primary, margin: `${space.lg} 0 ${space.sm}` }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: font.size.body.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: `${space.lg} 0 ${space.tiny}` }}>{children}</h3>,
                  p: ({ children }) => <p style={{ margin: `0 0 ${space.sm}`, lineHeight: font.lineHeight.relaxed, color: color.text.primary }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, color: color.text.primary, listStyleType: 'disc' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, color: color.text.primary, listStyleType: 'decimal' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: gap.sm, lineHeight: font.lineHeight.normal, color: color.text.primary }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ fontWeight: font.weight.semibold, color: color.text.primary }}>{children}</strong>,
                  hr: () => <hr style={{ border: 'none', borderTop: `${border.width.sm} solid ${color.border.secondary}`, margin: `${space.lg} 0` }} />,
                }}
              >
                {currentSection.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: space.lg }}>
          <div>
            {activeSection > 0 && (
              <Button variant="secondary" size="md" onClick={() => goToSection(activeSection - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div>
            {!isLastSection ? (
              <Button variant="primary" size="md" onClick={() => goToSection(activeSection + 1)}>
                Next
              </Button>
            ) : accepted ? (
              <Badge status="positive">Accepted</Badge>
            ) : null}
          </div>
        </div>

        {/* Mobile: valid until */}
        {isMobile && proposal.valid_until && (
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.muted, textAlign: 'center', marginTop: space.xl }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </main>
    </div>
  );
}

// --- Fee Summary Section ---

function FeeSummaryContent({ items, total, accepted, isExpired, email, setEmail, error, accepting, onAccept }: {
  items: ProposalItem[];
  total: number;
  accepted: boolean;
  isExpired: boolean;
  email: string;
  setEmail: (v: string) => void;
  error: string;
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: `${space.md} 0`,
            borderBottom: index < items.length - 1 ? `${border.width.sm} solid ${color.border.secondary}` : undefined,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: font.family.label, fontWeight: font.weight.medium, fontSize: font.size.body.sm, color: color.text.primary, margin: 0 }}>
              {item.name}
              {item.quantity > 1 && <span style={{ color: color.text.muted, fontWeight: font.weight.regular }}> x{item.quantity}</span>}
            </p>
            {item.description && (
              <p style={{ fontFamily: font.family.body, color: color.text.secondary, fontSize: font.size.body.sm, margin: `${gap.xs} 0 0` }}>
                {item.description}
              </p>
            )}
          </div>
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: font.weight.medium, color: color.text.primary, margin: 0, whiteSpace: 'nowrap', marginLeft: space.md }}>
            {formatCurrency(item.unit_price_cents * item.quantity)}
          </p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: space.md, marginTop: space.tiny, borderTop: `${border.width.md} solid ${color.border.muted}` }}>
        <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: color.text.primary, margin: 0 }}>
          Total
        </p>
        <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: color.brand.primary, margin: 0 }}>
          {formatCurrency(total)}
        </p>
      </div>

      {/* Accept section — inside the card */}
      {!accepted && !isExpired && (
        <div style={{ borderTop: `${border.width.sm} solid ${color.border.secondary}`, marginTop: space.lg, paddingTop: space.lg }}>
          <TextInput
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          {error && (
            <p style={{ color: color.system.red, fontSize: font.size.body.sm, fontFamily: font.family.body, margin: `${gap.sm} 0 0` }}>
              {error}
            </p>
          )}
          <div style={{ marginTop: space.md }}>
            <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.secondary, margin: `0 0 ${space.sm}` }}>
              By clicking Accept, you agree to the scope and pricing outlined in this proposal.
            </p>
            <Button variant="primary" size="md" loading={accepting} onClick={onAccept}>
              Accept Proposal
            </Button>
          </div>
        </div>
      )}

      {accepted && (
        <div style={{ borderTop: `${border.width.sm} solid ${color.border.secondary}`, marginTop: space.lg, paddingTop: space.lg }}>
          <Badge status="positive">Accepted</Badge>
        </div>
      )}

      {isExpired && !accepted && (
        <div style={{ borderTop: `${border.width.sm} solid ${color.border.secondary}`, marginTop: space.lg, paddingTop: space.lg }}>
          <Badge status="warning">Expired</Badge>
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, color: color.text.secondary, margin: `${space.sm} 0 0` }}>
            This proposal has expired. Please contact us for an updated proposal.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Simple fallback for proposals without sections ---

function SimpleFallback({ proposal, items, isExpired, accepted, email, setEmail, error, accepting, onAccept }: {
  proposal: Proposal;
  items: ProposalItem[];
  isExpired: boolean;
  accepted: boolean;
  email: string;
  setEmail: (v: string) => void;
  error: string;
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: color.surface.secondary }}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: space.xl }}>
          <Image
            src="/images/brik-logo.svg"
            alt="Brik Designs"
            width={120}
            height={42}
            priority
            style={{ marginBottom: space.xl }}
          />
          <p style={{ ...bodyStyle, color: color.text.muted, marginBottom: space.tiny }}>
            Proposal for {proposal.companies.name}
          </p>
          <h1 style={{ ...headingStyle, fontSize: font.size.heading.large }}>{proposal.title}</h1>
        </div>

        <div style={{
          backgroundColor: color.surface.primary,
          borderRadius: border.radius.lg,
          border: `${border.width.sm} solid ${color.border.muted}`,
          overflow: 'hidden',
          marginBottom: space.lg,
        }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                padding: `${space.md} ${space.lg}`,
                borderBottom: index < items.length - 1 ? `${border.width.sm} solid ${color.border.muted}` : undefined,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: gap.lg,
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: font.family.label, fontWeight: font.weight.medium, fontSize: font.size.body.md, color: color.text.primary, margin: 0 }}>
                  {item.name}
                  {item.quantity > 1 && <span style={{ color: color.text.muted, fontWeight: font.weight.regular }}> x{item.quantity}</span>}
                </p>
                {item.description && (
                  <p style={{ ...bodyStyle, color: color.text.muted, marginTop: gap.xs, fontSize: font.size.body.sm }}>
                    {item.description}
                  </p>
                )}
              </div>
              <p style={{ fontFamily: font.family.body, fontSize: font.size.body.md, fontWeight: font.weight.medium, color: color.text.primary, margin: 0, whiteSpace: 'nowrap' }}>
                {formatCurrency(item.unit_price_cents * item.quantity)}
              </p>
            </div>
          ))}
          <div style={{
            padding: `${space.md} ${space.lg}`,
            backgroundColor: color.surface.secondary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: color.text.primary, margin: 0 }}>
              Total
            </p>
            <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: color.text.primary, margin: 0 }}>
              {formatCurrency(proposal.total_amount_cents)}
            </p>
          </div>
        </div>

        {proposal.valid_until && (
          <p style={{ ...bodyStyle, textAlign: 'center', color: color.text.muted, marginBottom: space.lg }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        <div style={{
          backgroundColor: color.surface.primary,
          borderRadius: border.radius.lg,
          border: `${border.width.sm} solid ${color.border.muted}`,
          padding: `${space.xl} ${space.lg}`,
          textAlign: 'center',
        }}>
          {accepted ? (
            <>
              <Badge status="positive">Accepted</Badge>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginTop: space.sm }}>
                {proposal.accepted_by_email
                  ? `Accepted by ${proposal.accepted_by_email} on ${proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleDateString() : 'today'}`
                  : 'This proposal has been accepted. Thank you!'}
              </p>
            </>
          ) : isExpired ? (
            <>
              <Badge status="warning">Expired</Badge>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginTop: space.sm }}>
                This proposal has expired. Please contact us for an updated proposal.
              </p>
            </>
          ) : (
            <>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginBottom: space.md }}>
                By clicking Accept, you agree to the scope and pricing outlined in this proposal.
              </p>
              <div style={{ maxWidth: '320px', margin: `0 auto ${space.md}` }}>
                <TextInput
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              {error && (
                <p style={{ color: color.system.red, fontSize: font.size.body.sm, fontFamily: font.family.body, marginBottom: space.sm }}>
                  {error}
                </p>
              )}
              <Button variant="primary" size="md" loading={accepting} onClick={onAccept}>
                Accept Proposal
              </Button>
            </>
          )}
        </div>

        <p style={{ ...bodyStyle, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.sm, marginTop: space.xl }}>
          Powered by Brik Designs
        </p>
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: `${space.huge} ${space.lg}`,
};

const sidebarStyle: React.CSSProperties = {
  width: '280px',
  flexShrink: 0,
  padding: `${space.xl} ${space.lg}`,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `${border.width.sm} solid ${color.surface.secondary}`,
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: space.huge,
  maxWidth: '800px',
  margin: '0 auto',
};

const mainMobileStyle: React.CSSProperties = {
  flex: 1,
  padding: `${space.md} ${space.md} ${space.xl}`,
  maxWidth: '100%',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: color.surface.secondary,
  border: `${border.width.sm} solid ${color.border.secondary}`,
  borderRadius: border.radius.lg,
  padding: `${space.xl} ${space.lg}`,
};

const cardMobileStyle: React.CSSProperties = {
  backgroundColor: color.surface.secondary,
  border: `${border.width.sm} solid ${color.border.secondary}`,
  borderRadius: border.radius.md,
  padding: `${space.lg} ${space.md}`,
};

const proseStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  lineHeight: font.lineHeight.relaxed,
};

const headingStyle: React.CSSProperties = {
  fontFamily: font.family.heading,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  lineHeight: font.lineHeight.normal,
  color: color.text.primary,
  margin: 0,
};
