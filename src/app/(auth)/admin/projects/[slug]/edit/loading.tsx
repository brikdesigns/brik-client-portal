import { Skeleton } from '@/components/skeleton';
import { space } from '@/lib/tokens';

export default function EditProjectLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton variant="text" width={250} height={14} style={{ marginBottom: space.tiny }} />
      {/* Header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={220} height={16} />
        </div>
      </div>
      {/* Form card */}
      <Skeleton variant="rectangular" width={600} height={400} />
    </div>
  );
}
