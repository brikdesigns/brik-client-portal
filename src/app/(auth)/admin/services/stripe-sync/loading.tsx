import { Skeleton } from '@/components/skeleton';

export default function StripeSyncLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={200} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={400} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={200} />
    </div>
  );
}
