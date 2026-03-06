import { Skeleton } from '@/components/skeleton';
import { space } from '@/lib/tokens';

export default function ServicesLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Skeleton variant="text" width={140} height={28} />
          <div style={{ marginTop: space.tiny }}>
            <Skeleton variant="text" width={260} height={16} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={130} height={40} />
      </div>

      {/* Category groups */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: space.lg }}>
          <Skeleton variant="text" width={160} height={20} style={{ marginBottom: space.sm }} />
          <Skeleton variant="rectangular" height={120} />
        </div>
      ))}
    </div>
  );
}
