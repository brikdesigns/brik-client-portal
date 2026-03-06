import type { ReactNode } from 'react';
import { EmptyState as BdsEmptyState } from '@bds/components/ui/EmptyState/EmptyState';

/**
 * Portal EmptyState wrapper — renders BDS EmptyState with
 * transparent background for use inside existing Card containers.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <BdsEmptyState
      title={typeof children === 'string' ? children : ''}
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        minHeight: 'auto',
      }}
    />
  );
}
