import { Skeleton } from '@/components/skeleton';

export default function ServiceDetailLoading() {
  return (
    <div>
      {/* Back link + header */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={80} height={14} style={{ marginBottom: '16px' }} />
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={320} height={16} />
        </div>
      </div>

      {/* Detail card */}
      <Skeleton variant="rectangular" height={200} style={{ marginBottom: '24px' }} />

      {/* Client assignments table */}
      <Skeleton variant="rectangular" height={250} />
    </div>
  );
}
