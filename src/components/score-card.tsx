import { Card } from '@bds/components/ui/Card/Card';
import { ScoreTierBadge } from './report-badges';
import { tierLabel, type ScoreTier } from '@/lib/analysis/scoring';

interface ScoreCardProps {
  tier: ScoreTier;
  score: number;
  maxScore: number;
}

export function ScoreCard({ tier, score, maxScore }: ScoreCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: 'var(--_typography---heading--large)',
            fontWeight: 700,
            color: 'var(--_color---text--primary)',
          }}
        >
          {tierLabel(tier)}
        </span>
        <ScoreTierBadge tier={tier} />
      </div>
      <span
        style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: 'var(--_typography---body--sm)',
          color: 'var(--_color---text--secondary)',
        }}
      >
        Scored {score} of {maxScore}
      </span>
    </Card>
  );
}

interface NumericScoreCardProps {
  value: number | string;
  label: string;
}

export function NumericScoreCard({ value, label }: NumericScoreCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <span
        style={{
          fontFamily: 'var(--_typography---font-family--heading)',
          fontSize: 'var(--_typography---heading--large)',
          fontWeight: 700,
          color: 'var(--_color---text--primary)',
          display: 'block',
          marginBottom: '4px',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: 'var(--_typography---body--sm)',
          color: 'var(--_color---text--secondary)',
        }}
      >
        {label}
      </span>
    </Card>
  );
}
