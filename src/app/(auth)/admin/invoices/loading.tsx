import { Skeleton } from '@/components/skeleton';

export default function InvoicesLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton variant="text" width={140} height={28} />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" width={220} height={16} />
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>

      {/* Table */}
      <Skeleton variant="rectangular" height={350} />
    </div>
  );
}
