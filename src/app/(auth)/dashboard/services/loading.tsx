import { Skeleton } from '@/components/skeleton';

export default function ServicesLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={160} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={240} height={16} />
        </div>
      </div>

      {/* Service cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={90} />
        ))}
      </div>
    </div>
  );
}
