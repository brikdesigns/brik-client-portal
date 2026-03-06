import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space, gap } from '@/lib/tokens';

export default function AdminLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={180} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={280} height={16} />
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
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={100} />
        ))}
      </div>

      {/* Table */}
      <Skeleton variant="rectangular" height={300} />
    </div>
  );
}
