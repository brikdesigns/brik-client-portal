import { Skeleton } from '@/components/skeleton';

export default function ClientsLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Skeleton variant="text" width={120} height={28} />
          <div style={{ marginTop: '8px' }}>
            <Skeleton variant="text" width={300} height={16} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={120} height={40} />
      </div>

      {/* Table rows */}
      <Skeleton variant="rectangular" height={400} />
    </div>
  );
}
