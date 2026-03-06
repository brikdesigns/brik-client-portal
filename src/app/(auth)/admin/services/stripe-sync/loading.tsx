import { Skeleton } from '@/components/skeleton';
import { space } from '@/lib/tokens';

export default function StripeSyncLoading() {
  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={200} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={400} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={200} />
    </div>
  );
}
