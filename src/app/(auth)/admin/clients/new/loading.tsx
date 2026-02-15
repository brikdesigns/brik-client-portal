import { Skeleton } from '@/components/skeleton';

export default function NewClientLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={140} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={220} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={400} />
    </div>
  );
}
