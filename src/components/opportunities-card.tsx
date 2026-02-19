import { Card } from '@bds/components/ui/Card/Card';

interface OpportunitiesCardProps {
  text: string | null;
}

export function OpportunitiesCard({ text }: OpportunitiesCardProps) {
  if (!text) return null;

  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <Card variant="elevated" padding="lg">
      <h3
        style={{
          fontFamily: 'var(--_typography---font-family--heading)',
          fontSize: 'var(--_typography---heading--small)',
          fontWeight: 600,
          color: 'var(--_color---text--primary)',
          margin: '0 0 16px',
        }}
      >
        Opportunities
      </h3>
      <div
        style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--_color---text--secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0 }}>{p}</p>
        ))}
      </div>
    </Card>
  );
}
