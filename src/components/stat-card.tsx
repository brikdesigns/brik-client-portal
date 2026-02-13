import { Card } from '@bds/components/ui/Card/Card';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <p
        style={{
          fontFamily: 'var(--_typography---font-family--label)',
          fontSize: '13px',
          color: 'var(--_color---text--secondary)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--_typography---font-family--heading)',
          fontSize: '28px',
          fontWeight: 600,
          color: 'var(--_color---text--primary)',
          margin: '4px 0 0',
        }}
      >
        {value}
      </p>
    </Card>
  );
}
