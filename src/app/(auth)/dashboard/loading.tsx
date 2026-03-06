import { Skeleton } from '@/components/skeleton';
import { space, gap } from '@/lib/tokens';

export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={200} height={16} />
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: gap.lg,
          marginBottom: space.xl,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={90} />
        ))}
      </div>

      {/* 2-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: gap.xl }}>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" height={300} />
        ))}
      </div>
    </div>
  );
}
