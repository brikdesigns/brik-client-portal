import { Skeleton } from '@bds/components/ui/Skeleton/Skeleton';
import { space } from '@/lib/tokens';

export default function EditServiceLoading() {
  return (
    <div>
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={240} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={500} />
    </div>
  );
}
