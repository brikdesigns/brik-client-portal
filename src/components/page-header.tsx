import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  const hasAction = !!action;

  return (
    <div
      style={{
        display: hasAction ? 'flex' : undefined,
        justifyContent: hasAction ? 'space-between' : undefined,
        alignItems: hasAction ? 'flex-start' : undefined,
        marginBottom: '32px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: 'var(--_typography---heading--large, 28px)',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: 'var(--_typography---body--md-base, 14px)',
              color: 'var(--_color---text--secondary)',
              margin: '8px 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
