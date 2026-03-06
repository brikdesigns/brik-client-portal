'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { formatCurrency } from '@/lib/format';
import { font, color, border, space, gap } from '@/lib/tokens';

/**
 * Dark palette for standalone proposal viewer.
 *
 * This page is always dark-themed (not affected by portal theme toggle).
 * Uses BDS grayscale primitives directly since semantic tokens (--text-primary etc.)
 * resolve to light-mode values outside of data-theme="dark" context.
 */
const dk = {
  pageBg: 'var(--grayscale--black)',
  surface: 'var(--grayscale--darkest)',
  border: 'var(--grayscale--darker)',
  borderSubtle: 'var(--grayscale--dark)',
  text: 'var(--grayscale--white)',
  textSecondary: 'var(--grayscale--light)',
  textMuted: 'var(--grayscale--dark)',
  brand: 'var(--brand--primary)',
} as const;

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

export default function PublicProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);

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
    return (
      <div style={containerStyle}>
        <p style={{ textAlign: 'center', color: dk.textMuted, fontFamily: font.family.body }}>
          Loading proposal...
        </p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: `${space.huge} 0` }}>
          <h1 style={{ ...headingStyle, marginBottom: space.tiny }}>Proposal not found</h1>
          <p style={bodyStyle}>This proposal may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const items = [...proposal.proposal_items].sort((a, b) => a.sort_order - b.sort_order);
  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const sections = (proposal.sections || []).filter(s => s.content || s.type === 'fee_summary').sort((a, b) => a.sort_order - b.sort_order);
  const hasSections = sections.length > 0;

  // If no sections, fall back to simple line-items view
  if (!hasSections) {
    return <SimpleFallback proposal={proposal} items={items} isExpired={!!isExpired} accepted={accepted} email={email} setEmail={setEmail} error={error} accepting={accepting} onAccept={handleAccept} />;
  }

  const currentSection = sections[activeSection];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: dk.pageBg, display: 'flex' }}>
      {/* Sidebar */}
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
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.xs, color: dk.textMuted, margin: `0 0 ${space.lg}` }}>
            Proposal for {proposal.companies.name}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
            {sections.map((section, index) => {
              const isActive = index === activeSection;
              return (
                <button
                  key={section.type}
                  onClick={() => setActiveSection(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: gap.md,
                    padding: `${space.xs} ${space.md}`,
                    background: 'none',
                    border: 'none',
                    borderLeft: isActive ? `3px solid ${dk.brand}` : '3px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: font.family.body,
                    fontSize: font.size.body.sm,
                    fontWeight: isActive ? font.weight.semibold : font.weight.regular,
                    color: isActive ? dk.brand : dk.textSecondary,
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
                    backgroundColor: isActive ? dk.brand : dk.border,
                    color: isActive ? dk.text : dk.textMuted,
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
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.tiny, color: dk.textMuted, marginTop: 'auto' }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </aside>

      {/* Main content */}
      <main style={mainStyle}>
        {/* Page dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: gap.md, marginBottom: space.xl }}>
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSection(index)}
              style={{
                width: index === activeSection ? '24px' : '8px',
                height: '8px',
                borderRadius: border.radius.sm,
                backgroundColor: index === activeSection ? dk.brand : dk.border,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
              aria-label={`Go to section ${index + 1}`}
            />
          ))}
        </div>

        {/* Content card */}
        <div style={cardStyle}>
          <h1 style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.semibold, color: dk.text, margin: `0 0 ${space.lg}` }}>
            {currentSection.title}
          </h1>

          {currentSection.type === 'fee_summary' ? (
            <FeeSummaryContent items={items} total={proposal.total_amount_cents} />
          ) : (
            <div style={proseStyle}>
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 style={{ fontSize: font.size.body.lg, fontWeight: font.weight.semibold, color: dk.text, margin: `${space.lg} 0 ${space.sm}` }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: font.size.body.md, fontWeight: font.weight.semibold, color: dk.text, margin: `${space.lg} 0 ${space.tiny}` }}>{children}</h3>,
                  p: ({ children }) => <p style={{ margin: `0 0 ${space.sm}`, lineHeight: font.lineHeight.relaxed, color: dk.textSecondary }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, color: dk.textSecondary }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: space.lg, margin: `0 0 ${space.sm}`, color: dk.textSecondary }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: gap.sm, lineHeight: font.lineHeight.normal }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ fontWeight: font.weight.semibold, color: dk.text }}>{children}</strong>,
                  hr: () => <hr style={{ border: 'none', borderTop: `${border.width.sm} solid ${dk.border}`, margin: `${space.lg} 0` }} />,
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
              <Button variant="outline" size="md" onClick={() => setActiveSection(activeSection - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div>
            {activeSection < sections.length - 1 ? (
              <Button variant="primary" size="md" onClick={() => setActiveSection(activeSection + 1)}>
                Next
              </Button>
            ) : !accepted && !isExpired ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: space.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                  <TextInput
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button variant="primary" size="md" onClick={handleAccept} disabled={accepting}>
                    {accepting ? 'Accepting...' : 'Accept Proposal'}
                  </Button>
                </div>
                {error && (
                  <p style={{ color: color.system.red, fontSize: font.size.body.xs, fontFamily: font.family.body, margin: 0 }}>
                    {error}
                  </p>
                )}
              </div>
            ) : accepted ? (
              <Badge status="positive">Accepted</Badge>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Fee Summary Section ---

function FeeSummaryContent({ items, total }: { items: ProposalItem[]; total: number }) {
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
            borderBottom: index < items.length - 1 ? `${border.width.sm} solid ${dk.border}` : undefined,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: font.family.label, fontWeight: font.weight.medium, fontSize: font.size.body.sm, color: dk.text, margin: 0 }}>
              {item.name}
              {item.quantity > 1 && <span style={{ color: dk.textMuted, fontWeight: font.weight.regular }}> x{item.quantity}</span>}
            </p>
            {item.description && (
              <p style={{ fontFamily: font.family.body, color: dk.textMuted, fontSize: font.size.body.xs, margin: `${gap.xs} 0 0` }}>
                {item.description}
              </p>
            )}
          </div>
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, fontWeight: font.weight.medium, color: dk.text, margin: 0, whiteSpace: 'nowrap' }}>
            {formatCurrency(item.unit_price_cents * item.quantity)}
          </p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: space.md, marginTop: space.tiny, borderTop: `${border.width.md} solid ${dk.borderSubtle}` }}>
        <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: dk.text, margin: 0 }}>
          Total
        </p>
        <p style={{ fontFamily: font.family.heading, fontWeight: font.weight.semibold, fontSize: font.size.body.lg, color: dk.brand, margin: 0 }}>
          {formatCurrency(total)}
        </p>
      </div>
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
                  label="Your Email"
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
              <Button variant="primary" size="md" onClick={onAccept} disabled={accepting}>
                {accepting ? 'Accepting...' : 'Accept Proposal'}
              </Button>
            </>
          )}
        </div>

        <p style={{ ...bodyStyle, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.xs, marginTop: space.xl }}>
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
  borderRight: `${border.width.sm} solid ${dk.surface}`,
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

const cardStyle: React.CSSProperties = {
  backgroundColor: dk.surface,
  border: `${border.width.sm} solid ${dk.border}`,
  borderRadius: border.radius.lg,
  padding: `${space.xl} ${space.lg}`,
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
