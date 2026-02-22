'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Badge } from '@bds/components/ui/Badge/Badge';

interface Agreement {
  id: string;
  type: string;
  title: string;
  status: string;
  token: string;
  content_snapshot: string;
  valid_until: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  signed_by_email: string | null;
  created_at: string;
  clients: { name: string; contact_email: string | null };
}

export default function PublicAgreementPage() {
  const params = useParams();
  const token = params.token as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agreements/${token}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setAgreement(data.agreement);
        if (data.agreement.status === 'signed') {
          setSigned(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleSign() {
    if (!fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!consent) {
      setError('You must agree to the terms before signing.');
      return;
    }

    setError('');
    setSigning(true);

    try {
      const res = await fetch(`/api/agreements/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sign agreement.');
        return;
      }

      setSigned(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ textAlign: 'center', color: 'var(--_color---text--muted)', fontFamily: 'var(--_typography---font-family--body)' }}>
          Loading agreement...
        </p>
      </div>
    );
  }

  if (notFound || !agreement) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h1 style={{ ...headingStyle, marginBottom: '8px' }}>Agreement not found</h1>
          <p style={bodyStyle}>This agreement may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const isDraft = agreement.status === 'draft';
  const isExpired = agreement.status === 'expired' || (agreement.valid_until && new Date(agreement.valid_until) < new Date());
  const canSign = !signed && !isDraft && !isExpired;

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
            {agreement.title} for {agreement.clients.name}
          </p>
          <h1 style={{ ...headingStyle, fontSize: '28px' }}>{agreement.title}</h1>
        </div>

        {/* Agreement text */}
        <div
          style={{
            backgroundColor: 'var(--_color---surface--primary)',
            borderRadius: 'var(--_border-radius---lg)',
            border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
            padding: '40px 32px',
            marginBottom: '24px',
          }}
        >
          <div style={proseStyle}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ ...headingStyle, fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ ...headingStyle, fontSize: '20px', marginBottom: '12px', marginTop: '28px' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ ...headingStyle, fontSize: '17px', marginBottom: '8px', marginTop: '24px' }}>{children}</h3>,
                p: ({ children }) => <p style={{ ...bodyStyle, marginBottom: '12px' }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                ul: ({ children }) => <ul style={{ ...bodyStyle, paddingLeft: '24px', marginBottom: '12px' }}>{children}</ul>,
                li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                hr: () => <hr style={{ border: 'none', borderTop: 'var(--_border-width---sm) solid var(--_color---border--muted)', margin: '24px 0' }} />,
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: 'var(--_typography---font-family--body)' }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--_color---border--muted)', fontWeight: 600, fontSize: '13px', color: 'var(--_color---text--muted)' }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ padding: '8px 12px', borderBottom: 'var(--_border-width---sm) solid var(--_color---border--muted)' }}>
                    {children}
                  </td>
                ),
              }}
            >
              {agreement.content_snapshot}
            </ReactMarkdown>
          </div>
        </div>

        {/* Signing section */}
        <div
          style={{
            backgroundColor: 'var(--_color---surface--primary)',
            borderRadius: 'var(--_border-radius---lg)',
            border: 'var(--_border-width---sm) solid var(--_color---border--muted)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          {signed ? (
            <>
              <Badge status="positive">Signed</Badge>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginTop: '12px' }}>
                {agreement.signed_by_name
                  ? `Signed by ${agreement.signed_by_name} on ${agreement.signed_at ? new Date(agreement.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'today'}`
                  : 'This agreement has been signed. Thank you!'}
              </p>
            </>
          ) : isDraft ? (
            <>
              <Badge status="neutral">Pending</Badge>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginTop: '12px' }}>
                This agreement is being prepared. You&apos;ll be notified when it&apos;s ready for signing.
              </p>
            </>
          ) : isExpired ? (
            <>
              <Badge status="warning">Expired</Badge>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginTop: '12px' }}>
                This agreement has expired. Please contact us for an updated agreement.
              </p>
            </>
          ) : canSign ? (
            <>
              <h2 style={{ ...headingStyle, fontSize: '20px', marginBottom: '8px' }}>Sign this agreement</h2>
              <p style={{ ...bodyStyle, color: 'var(--_color---text--secondary)', marginBottom: '24px' }}>
                By signing below, you agree to all terms outlined in this {agreement.title.toLowerCase()}.
              </p>

              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '16px' }}>
                  <TextInput
                    label="Full Legal Name"
                    type="text"
                    placeholder="Your full legal name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <TextInput
                    label="Email Address"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                  />
                </div>

                {/* Consent checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '20px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '3px', width: '18px', height: '18px', flexShrink: 0, accentColor: 'var(--_color---brand--primary)' }}
                  />
                  <span style={{ fontFamily: 'var(--_typography---font-family--body)', fontSize: '14px', lineHeight: 1.5, color: 'var(--_color---text--secondary)' }}>
                    I have read and agree to the terms of this {agreement.title.toLowerCase()}. I understand that typing my name and clicking &quot;Sign Agreement&quot; constitutes a legally binding electronic signature under the ESIGN Act.
                  </span>
                </label>

                {error && (
                  <p style={{ color: 'var(--system--red, #eb5757)', fontSize: '14px', fontFamily: 'var(--_typography---font-family--body)', marginBottom: '12px' }}>
                    {error}
                  </p>
                )}

                <Button variant="primary" size="md" onClick={handleSign} disabled={signing}>
                  {signing ? 'Signing...' : 'Sign Agreement'}
                </Button>
              </div>
            </>
          ) : null}
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
  maxWidth: '720px',
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

const proseStyle: React.CSSProperties = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'var(--_color---text--primary)',
};
