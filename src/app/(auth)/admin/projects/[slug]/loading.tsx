import { Skeleton } from '@/components/skeleton';

export default function ProjectDetailLoading() {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton variant="text" width={200} height={14} style={{ marginBottom: '8px' }} />
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Skeleton variant="text" width={200} height={28} />
          <div style={{ marginTop: '8px' }}>
            <Skeleton variant="text" width={300} height={16} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={110} height={36} />
      </div>
      {/* Details card */}
      <Skeleton variant="rectangular" height={200} />
    </div>
  );
}
