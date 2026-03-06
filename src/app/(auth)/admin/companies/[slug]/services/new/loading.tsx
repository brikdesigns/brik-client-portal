import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space } from '@/lib/tokens';

export default function AssignServiceLoading() {
  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={180} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={260} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={350} />
    </div>
  );
}
