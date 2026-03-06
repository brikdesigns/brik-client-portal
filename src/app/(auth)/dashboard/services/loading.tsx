import { Skeleton } from '@/components/skeleton';
import { space, gap } from '@/lib/tokens';

export default function ServicesLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={240} height={16} />
        </div>
      </div>

      {/* Service cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.lg }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={90} />
        ))}
      </div>
    </div>
  );
}
