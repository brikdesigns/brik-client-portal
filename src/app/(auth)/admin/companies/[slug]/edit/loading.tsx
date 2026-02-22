import { Skeleton } from '@/components/skeleton';

export default function EditClientLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={240} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={400} />
    </div>
  );
}
