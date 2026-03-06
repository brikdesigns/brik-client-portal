import type { ReactNode } from 'react';
import { font, color, space } from '@/lib/tokens';

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        color: color.text.muted,
        fontFamily: font.family.body,
        fontSize: font.size.body.sm,
        textAlign: 'center',
        padding: `${space.lg} 0`,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
