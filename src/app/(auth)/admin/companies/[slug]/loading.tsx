import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space, gap } from '@/lib/tokens';

export default function ClientDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={200} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={160} height={16} />
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: gap.lg,
          marginBottom: space.xl,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="rectangular" height={200} />
      </div>
    </div>
  );
}
