import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space, gap } from '@/lib/tokens';

export default function DashboardProfileLoading() {
  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={160} height={28} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.lg }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width={80} height={14} />
            <div style={{ marginTop: space.tiny }}>
              <Skeleton variant="text" width={140} height={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
