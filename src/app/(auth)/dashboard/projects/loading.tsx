import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space } from '@/lib/tokens';

export default function DashboardProjectsLoading() {
  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={160} height={28} />
      </div>
      <Skeleton variant="rectangular" height={300} />
    </div>
  );
}
