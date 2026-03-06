'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Button } from '@bds/components/ui/Button/Button';
import { TextInput } from '@bds/components/ui/TextInput/TextInput';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { font, color, border, space, gap } from '@/lib/tokens';

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
  companies: { name: string; contact_email: string | null };
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
        <p style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.body }}>
          Loading agreement...
        </p>
      </div>
    );
  }

  if (notFound || !agreement) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: `${space.huge} 0` }}>
          <h1 style={{ ...headingStyle, marginBottom: space.tiny }}>Agreement not found</h1>
          <p style={bodyStyle}>This agreement may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const isDraft = agreement.status === 'draft';
  const isExpired = agreement.status === 'expired' || (agreement.valid_until && new Date(agreement.valid_until) < new Date());
  const canSign = !signed && !isDraft && !isExpired;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: color.surface.secondary }}>
      <div style={containerStyle}>
        {/* Header */}
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
            {agreement.title} for {agreement.companies.name}
          </p>
          <h1 style={{ ...headingStyle, fontSize: font.size.heading.large }}>{agreement.title}</h1>
        </div>

        {/* Agreement text */}
        <div
          style={{
            backgroundColor: color.surface.primary,
            borderRadius: border.radius.lg,
            border: `${border.width.sm} solid ${color.border.muted}`,
            padding: `${space.xl} ${space.lg}`,
            marginBottom: space.lg,
          }}
        >
          <div style={proseStyle}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ ...headingStyle, fontSize: font.size.heading.medium, marginBottom: space.md, marginTop: space.xl }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ ...headingStyle, fontSize: font.size.heading.small, marginBottom: space.sm, marginTop: space.lg }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ ...headingStyle, fontSize: font.size.heading.tiny, marginBottom: space.tiny, marginTop: space.lg }}>{children}</h3>,
                p: ({ children }) => <p style={{ ...bodyStyle, marginBottom: space.sm }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: font.weight.semibold }}>{children}</strong>,
                ul: ({ children }) => <ul style={{ ...bodyStyle, paddingLeft: space.lg, marginBottom: space.sm }}>{children}</ul>,
                li: ({ children }) => <li style={{ marginBottom: gap.xs }}>{children}</li>,
                hr: () => <hr style={{ border: 'none', borderTop: `${border.width.sm} solid ${color.border.muted}`, margin: `${space.lg} 0` }} />,
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', marginBottom: space.md }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{ textAlign: 'left', padding: `${space.tiny} ${space.sm}`, borderBottom: `${border.width.md} solid ${color.border.muted}`, fontWeight: font.weight.semibold, fontSize: font.size.body.sm, color: color.text.muted }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ padding: `${space.tiny} ${space.sm}`, borderBottom: `${border.width.sm} solid ${color.border.muted}` }}>
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
            backgroundColor: color.surface.primary,
            borderRadius: border.radius.lg,
            border: `${border.width.sm} solid ${color.border.muted}`,
            padding: `${space.xl} ${space.lg}`,
            textAlign: 'center',
          }}
        >
          {signed ? (
            <>
              <Badge status="positive">Signed</Badge>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginTop: space.sm }}>
                {agreement.signed_by_name
                  ? `Signed by ${agreement.signed_by_name} on ${agreement.signed_at ? new Date(agreement.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'today'}`
                  : 'This agreement has been signed. Thank you!'}
              </p>
            </>
          ) : isDraft ? (
            <>
              <Badge status="neutral">Pending</Badge>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginTop: space.sm }}>
                This agreement is being prepared. You&apos;ll be notified when it&apos;s ready for signing.
              </p>
            </>
          ) : isExpired ? (
            <>
              <Badge status="warning">Expired</Badge>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginTop: space.sm }}>
                This agreement has expired. Please contact us for an updated agreement.
              </p>
            </>
          ) : canSign ? (
            <>
              <h2 style={{ ...headingStyle, fontSize: font.size.heading.small, marginBottom: space.tiny }}>Sign this agreement</h2>
              <p style={{ ...bodyStyle, color: color.text.secondary, marginBottom: space.lg }}>
                By signing below, you agree to all terms outlined in this {agreement.title.toLowerCase()}.
              </p>

              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ marginBottom: space.md }}>
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
                <div style={{ marginBottom: space.md }}>
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
                    gap: gap.md,
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: space.md,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '3px', width: '18px', height: '18px', flexShrink: 0, accentColor: color.brand.primary }}
                  />
                  <span style={{ fontFamily: font.family.body, fontSize: font.size.body.sm, lineHeight: font.lineHeight.normal, color: color.text.secondary }}>
                    I have read and agree to the terms of this {agreement.title.toLowerCase()}. I understand that typing my name and clicking &quot;Sign Agreement&quot; constitutes a legally binding electronic signature under the ESIGN Act.
                  </span>
                </label>

                {error && (
                  <p style={{ color: color.system.red, fontSize: font.size.body.sm, fontFamily: font.family.body, marginBottom: space.sm }}>
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
        <p style={{ ...bodyStyle, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.xs, marginTop: space.xl }}>
          Powered by Brik Designs
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: `${space.huge} ${space.lg}`,
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

const proseStyle: React.CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  lineHeight: font.lineHeight.relaxed,
  color: color.text.primary,
};
