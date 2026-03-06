import { Skeleton } from '@/components/skeleton';
import { space, gap } from '@/lib/tokens';

export default function ProjectsLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: space.xl, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Skeleton variant="text" width={140} height={28} />
          <div style={{ marginTop: space.tiny }}>
            <Skeleton variant="text" width={260} height={16} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={130} height={40} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: gap.lg, marginBottom: space.xl }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>

      {/* Table */}
      <Skeleton variant="rectangular" height={300} />
    </div>
  );
}
