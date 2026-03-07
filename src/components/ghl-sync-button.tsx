'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@bds/components/ui/Button/Button';

interface GHLSyncButtonProps {
  companyId: string;
  hasGhlId: boolean;
}

export function GHLSyncButton({ companyId, hasGhlId }: GHLSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!hasGhlId) return null;

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ghl-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sync failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
        {syncing ? 'Syncing...' : 'Sync GHL'}
      </Button>
      {error && (
        <span style={{ color: 'var(--system--red)', fontSize: 'var(--body-xs)' }}>
          {error}
        </span>
      )}
    </>
  );
}
