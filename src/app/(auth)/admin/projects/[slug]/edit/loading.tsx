import { Skeleton } from '@/components/skeleton';

export default function EditProjectLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton variant="text" width={250} height={14} style={{ marginBottom: '8px' }} />
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={220} height={16} />
        </div>
      </div>
      {/* Form card */}
      <Skeleton variant="rectangular" width={600} height={400} />
    </div>
  );
}
