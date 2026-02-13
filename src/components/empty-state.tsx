import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        color: 'var(--_color---text--muted)',
        fontFamily: 'var(--_typography---font-family--body)',
        fontSize: '14px',
        textAlign: 'center',
        padding: '24px 0',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
