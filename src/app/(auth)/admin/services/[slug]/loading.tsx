import { Skeleton } from '@/components/skeleton';
import { space } from '@/lib/tokens';

export default function ServiceDetailLoading() {
  return (
    <div>
      {/* Back link + header */}
      <div style={{ marginBottom: space.xl }}>
        <Skeleton variant="text" width={80} height={14} style={{ marginBottom: space.md }} />
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ marginTop: space.tiny }}>
          <Skeleton variant="text" width={320} height={16} />
        </div>
      </div>

      {/* Detail card */}
      <Skeleton variant="rectangular" height={200} style={{ marginBottom: space.lg }} />

      {/* Client assignments table */}
      <Skeleton variant="rectangular" height={250} />
    </div>
  );
}
