'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
  clients: { name: string; contact_email: string | null };
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
        <p style={{ textAlign: 'center', color: 'var(--_color---text--muted)', fontFamily: 'var(--_typography---font-family--body)' }}>
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--_color---surface--secondary)' }}>
      <div style={containerStyle}>
        {/* Header */}
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
            Proposal for {proposal.clients.name}
          </p>
          <h1 style={{ ...headingStyle, fontSize: '28px' }}>{proposal.title}</h1>
        </div>

        {/* Line items */}
        <div
          style={{
            backgroundColor: 'var(--_color---surface--primary)',
            borderRadius: 'var(--_border-radius---lg)',
            border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
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

          {/* Total */}
          <div
            style={{
              padding: '20px 24px',
              backgroundColor: 'var(--_color---surface--secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: 'var(--_color---text--primary)', margin: 0 }}>
              Total
            </p>
            <p style={{ fontFamily: 'var(--_typography---font-family--heading)', fontWeight: 600, fontSize: '18px', color: 'var(--_color---text--primary)', margin: 0 }}>
              {formatCurrency(proposal.total_amount_cents)}
            </p>
          </div>
        </div>

        {/* Valid until */}
        {proposal.valid_until && (
          <p style={{ ...bodyStyle, textAlign: 'center', color: 'var(--_color---text--muted)', marginBottom: '24px' }}>
            Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Acceptance section */}
        <div
          style={{
            backgroundColor: 'var(--_color---surface--primary)',
            borderRadius: 'var(--_border-radius---lg)',
            border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
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
              <Button variant="primary" size="md" onClick={handleAccept} disabled={accepting}>
                {accepting ? 'Accepting...' : 'Accept Proposal'}
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ ...bodyStyle, textAlign: 'center', color: 'var(--_color---text--muted)', fontSize: '13px', marginTop: '32px' }}>
          Powered by Brik Designs
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '48px 24px',
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
