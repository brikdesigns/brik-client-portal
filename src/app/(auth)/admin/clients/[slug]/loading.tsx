import { Skeleton } from '@/components/skeleton';

export default function ClientDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={200} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={160} height={16} />
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="rectangular" height={200} />
      </div>
    </div>
  );
}
