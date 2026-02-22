import { Skeleton } from '@/components/skeleton';

export default function AssignServiceLoading() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={180} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={260} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={350} />
    </div>
  );
}
