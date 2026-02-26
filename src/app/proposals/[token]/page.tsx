'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { formatCurrency } from '@/lib/format';

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
        <p style={{ textAlign: 'center', color: '#999', fontFamily: 'var(--_typography---font-family--body)' }}>
          Loading proposal...
        </p>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h1 style={{ ...headingStyle, marginBottom: '8px' }}>Proposal not found</h1>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div>
          <Image
            src="/images/brik-logo-white.svg"
            alt="Brik Designs"
            width={100}
            height={35}
            priority
            style={{ marginBottom: '40px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/brik-logo.svg';
            }}
          />
          <p style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '13px', color: '#999', margin: '0 0 24px' }}>
            Proposal for {proposal.companies.name}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((section, index) => {
              const isActive = index === activeSection;
              return (
                <button
                  key={section.type}
                  onClick={() => setActiveSection(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #E35335' : '3px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--_typography---font-family--body)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#E35335' : '#ccc',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: isActive ? '#E35335' : '#333',
                    color: isActive ? '#fff' : '#999',
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
          <p style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '12px', color: '#666', marginTop: 'auto' }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </aside>

      {/* Main content */}
      <main style={mainStyle}>
        {/* Page dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSection(index)}
              style={{
                width: index === activeSection ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === activeSection ? '#E35335' : '#444',
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
          <h1 style={{ fontFamily: 'var(--_typography---font-family--heading)', fontSize: '24px', fontWeight: 600, color: '#fff', margin: '0 0 24px' }}>
            {currentSection.title}
          </h1>

          {currentSection.type === 'fee_summary' ? (
            <FeeSummaryContent items={items} total={proposal.total_amount_cents} />
          ) : (
            <div style={proseStyle}>
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '28px 0 12px' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '24px 0 8px' }}>{children}</h3>,
                  p: ({ children }) => <p style={{ margin: '0 0 14px', lineHeight: 1.7, color: '#ccc' }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ paddingLeft: '24px', margin: '0 0 14px', color: '#ccc' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: '24px', margin: '0 0 14px', color: '#ccc' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: '6px', lineHeight: 1.6 }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#fff' }}>{children}</strong>,
                  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />,
                }}
              >
                {currentSection.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  <p style={{ color: '#eb5757', fontSize: '13px', fontFamily: 'var(--_typography---font-family--body)', margin: 0 }}>
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
            padding: '16px 0',
            borderBottom: index < items.length - 1 ? '1px solid #333' : undefined,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--_typography---font-family--label)', fontWeight: 500, fontSize: '15px', color: '#fff', margin: 0 }}>
              {item.name}
              {item.quantity > 1 && <span style={{ color: '#999', fontWeight: 400 }}> x{item.quantity}</span>}
            </p>
            {item.description && (
              <p style={{ fontFamily: 'var(--_typography---font-family--body)', color: '#999', marginTop: '4px', fontSize: '13px', margin: '4px 0 0' }}>
                {item.description}
              </p>
            )}
          </div>
          <p style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '15px', fontWeight: 500, color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
            {formatCurrency(item.unit_price_cents * item.quantity)}
          </p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', marginTop: '8px', borderTop: '2px solid #444' }}>
        <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: '#fff', margin: 0 }}>
          Total
        </p>
        <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: '#E35335', margin: 0 }}>
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--_color---surface--secondary)' }}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Image
            src="/images/brik-logo.svg"
            alt="Brik Designs"
            width={120}
            height={42}
            priority
            style={{ marginBottom: '32px' }}
          />
          <p style={{ ...bodyStyle, color: 'var(--_color---text--muted)', marginBottom: '8px' }}>
            Proposal for {proposal.companies.name}
          </p>
          <h1 style={{ ...headingStyle, fontSize: '28px' }}>{proposal.title}</h1>
        </div>

        <div style={{
          backgroundColor: 'var(--_color---surface--primary)',
          borderRadius: 'var(--_border-radius---lg)',
          border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                padding: '20px 24px',
                borderBottom: index < items.length - 1 ? 'var(--_border-width---sm) solid var(--_color---border--muted)' : undefined,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--_typography---font-family--label)', fontWeight: 500, fontSize: '16px', color: 'var(--_color---text--primary)', margin: 0 }}>
                  {item.name}
                  {item.quantity > 1 && <span style={{ color: 'var(--_color---text--muted)', fontWeight: 400 }}> x{item.quantity}</span>}
                </p>
                {item.description && (
                  <p style={{ ...bodyStyle, color: 'var(--_color---text--muted)', marginTop: '4px', fontSize: '14px' }}>
                    {item.description}
                  </p>
                )}
              </div>
              <p style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '16px', fontWeight: 500, color: 'var(--_color---text--primary)', margin: 0, whiteSpace: 'nowrap' }}>
                {formatCurrency(item.unit_price_cents * item.quantity)}
              </p>
            </div>
          ))}
          <div style={{
            padding: '20px 24px',
            backgroundColor: 'var(--_color---surface--secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: 'var(--_color---text--primary)', margin: 0 }}>
              Total
            </p>
            <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: 'var(--_color---text--primary)', margin: 0 }}>
              {formatCurrency(proposal.total_amount_cents)}
            </p>
          </div>
        </div>

        {proposal.valid_until && (
          <p style={{ ...bodyStyle, textAlign: 'center', color: 'var(--_color---text--muted)', marginBottom: '24px' }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        <div style={{
          backgroundColor: 'var(--_color---surface--primary)',
          borderRadius: 'var(--_border-radius---lg)',
          border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          {accepted ? (
            <>
              <Badge status="positive">Accepted</Badge>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginTop: '12px' }}>
                {proposal.accepted_by_email
                  ? `Accepted by ${proposal.accepted_by_email} on ${proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleDateString() : 'today'}`
                  : 'This proposal has been accepted. Thank you!'}
              </p>
            </>
          ) : isExpired ? (
            <>
              <Badge status="warning">Expired</Badge>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginTop: '12px' }}>
                This proposal has expired. Please contact us for an updated proposal.
              </p>
            </>
          ) : (
            <>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginBottom: '20px' }}>
                By clicking Accept, you agree to the scope and pricing outlined in this proposal.
              </p>
              <div style={{ maxWidth: '320px', margin: '0 auto 16px' }}>
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
                <p style={{ color: 'var(--system--red, #eb5757)', fontSize: '14px', fontFamily: 'var(--_typography---font-family--body)', marginBottom: '12px' }}>
                  {error}
                </p>
              )}
              <Button variant="primary" size="md" onClick={onAccept} disabled={accepting}>
                {accepting ? 'Accepting...' : 'Accept Proposal'}
              </Button>
            </>
          )}
        </div>

        <p style={{ ...bodyStyle, textAlign: 'center', color: 'var(--_color---text--muted)', fontSize: '13px', marginTop: '32px' }}>
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
  padding: '48px 24px',
};

const sidebarStyle: React.CSSProperties = {
  width: '280px',
  flexShrink: 0,
  padding: '32px 24px',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #222',
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '48px',
  maxWidth: '800px',
  margin: '0 auto',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1b1b1b',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '40px 36px',
};

const proseStyle: React.CSSProperties = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '15px',
  lineHeight: 1.7,
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--_typography---font-family--heading)',
  fontWeight: 600,
  color: 'var(--_color---text--primary)',
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '16px',
  lineHeight: 1.6,
  color: 'var(--_color---text--primary)',
  margin: 0,
};
