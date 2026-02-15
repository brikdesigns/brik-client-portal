'use client';

import { useState } from 'react';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';

interface SyncResponse {
  dry_run: boolean;
  summary: {
    matched: number;
    unmatched_stripe: number;
    unmatched_portal: number;
    errors: number;
  };
  matched: { service_name: string; stripe_product_id: string; stripe_price_id: string | null }[];
  unmatched_stripe: { name: string; stripe_product_id: string }[];
  unmatched_portal: { name: string; service_id: string }[];
  errors: string[];
}

type SyncState = 'idle' | 'previewing' | 'previewed' | 'syncing' | 'complete' | 'error';

const linkStyle = {
  fontFamily: 'var(--_typography---font-family--body)',
  fontSize: '13px',
  color: 'var(--_color---system--link, #0034ea)',
  textDecoration: 'none' as const,
};

const sectionHeadingStyle = {
  fontFamily: 'var(--_typography---font-family--heading)',
  fontSize: 'var(--_typography---heading--small, 18px)',
  fontWeight: 600,
  color: 'var(--_color---text--primary)',
  margin: '0 0 16px',
};

const monoStyle = {
  fontFamily: 'monospace',
  fontSize: '12px',
  color: 'var(--_color---text--secondary)',
};

export default function StripeSyncPage() {
  const [state, setState] = useState<SyncState>('idle');
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState('');

  async function runSync(dryRun: boolean) {
    setState(dryRun ? 'previewing' : 'syncing');
    setError('');

    try {
      const res = await fetch('/api/admin/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Sync failed');
        setState('error');
        return;
      }

      setResult(data);
      setState(dryRun ? 'previewed' : 'complete');
    } catch {
      setError('Network error. Please try again.');
      setState('error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Stripe product sync"
        subtitle="Match Stripe products to portal services by name and populate Stripe IDs."
        action={<a href="/admin/services" style={linkStyle}>Back to services</a>}
      />

      {/* Initial / error state */}
      {(state === 'idle' || state === 'error') && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--secondary)',
              margin: '0 0 8px',
              lineHeight: 1.6,
            }}
          >
            This will fetch all active products from your Stripe account, match them
            to portal services by name (case-insensitive), and populate the{' '}
            <code style={{ fontSize: '12px', backgroundColor: 'var(--_color---background--secondary)', padding: '2px 4px', borderRadius: '2px' }}>
              stripe_product_id
            </code>{' '}
            and{' '}
            <code style={{ fontSize: '12px', backgroundColor: 'var(--_color---background--secondary)', padding: '2px 4px', borderRadius: '2px' }}>
              stripe_price_id
            </code>{' '}
            fields.
          </p>
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '13px',
              color: 'var(--_color---text--muted)',
              margin: '0 0 20px',
            }}
          >
            Services that already have Stripe IDs will be overwritten with fresh values.
          </p>
          <Button variant="primary" size="md" onClick={() => runSync(true)}>
            Preview sync
          </Button>
          {error && (
            <p style={{ color: 'var(--system--red, #d32f2f)', marginTop: '12px', fontSize: '14px' }}>
              {error}
            </p>
          )}
        </Card>
      )}

      {/* Loading */}
      {(state === 'previewing' || state === 'syncing') && (
        <Card variant="elevated" padding="lg">
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--secondary)',
              margin: 0,
            }}
          >
            {state === 'previewing' ? 'Fetching Stripe products…' : 'Applying sync…'}
          </p>
        </Card>
      )}

      {/* Results */}
      {result && (state === 'previewed' || state === 'complete') && (
        <>
          {/* Summary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <CardSummary label="Matched" value={result.summary.matched} />
            <CardSummary label="Unmatched (Stripe)" value={result.summary.unmatched_stripe} />
            <CardSummary label="Unmatched (portal)" value={result.summary.unmatched_portal} />
            {result.summary.errors > 0 && <CardSummary label="Errors" value={result.summary.errors} />}
          </div>

          {/* Matched */}
          {result.matched.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={sectionHeadingStyle}>Matched services ({result.matched.length})</h2>
              <DataTable
                data={result.matched}
                rowKey={(m) => m.stripe_product_id}
                columns={[
                  { header: 'Service', accessor: (m) => m.service_name, style: { fontWeight: 500 } },
                  { header: 'Product ID', accessor: (m) => m.stripe_product_id, style: monoStyle },
                  { header: 'Price ID', accessor: (m) => m.stripe_price_id || '—', style: monoStyle },
                ]}
              />
            </Card>
          )}

          {/* Unmatched Stripe */}
          {result.unmatched_stripe.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={sectionHeadingStyle}>
                Stripe products without portal match ({result.unmatched_stripe.length})
              </h2>
              <DataTable
                data={result.unmatched_stripe}
                rowKey={(u) => u.stripe_product_id}
                columns={[
                  { header: 'Product name', accessor: (u) => u.name },
                  { header: 'Product ID', accessor: (u) => u.stripe_product_id, style: monoStyle },
                ]}
              />
            </Card>
          )}

          {/* Unmatched portal */}
          {result.unmatched_portal.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={sectionHeadingStyle}>
                Portal services without Stripe match ({result.unmatched_portal.length})
              </h2>
              <DataTable
                data={result.unmatched_portal}
                rowKey={(u) => u.service_id}
                columns={[
                  { header: 'Service name', accessor: (u) => u.name },
                ]}
              />
            </Card>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={{ ...sectionHeadingStyle, color: 'var(--system--red, #d32f2f)' }}>
                Errors ({result.errors.length})
              </h2>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--_color---text--secondary)' }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {state === 'previewed' && (
              <>
                <Button variant="primary" size="md" onClick={() => runSync(false)}>
                  Apply sync ({result.summary.matched} services)
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => { setState('idle'); setResult(null); }}
                >
                  Cancel
                </Button>
              </>
            )}
            {state === 'complete' && (
              <>
                <p
                  style={{
                    fontFamily: 'var(--_typography---font-family--body)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--services--green-dark)',
                    margin: 0,
                  }}
                >
                  Sync complete. {result.summary.matched} services updated.
                </p>
                <Button variant="outline" size="md" asLink href="/admin/services">
                  Back to services
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
