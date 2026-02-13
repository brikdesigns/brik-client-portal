export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            height: '28px',
            width: '240px',
            backgroundColor: 'var(--_color---border--secondary, #e0e0e0)',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '200px',
            backgroundColor: 'var(--_color---border--secondary, #e0e0e0)',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Stats skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '90px',
              backgroundColor: 'var(--_color---surface--primary, white)',
              borderRadius: 'var(--_border-radius---md, 4px)',
              boxShadow: 'var(--_box-shadow---md)',
            }}
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: '300px',
              backgroundColor: 'var(--_color---surface--primary, white)',
              borderRadius: 'var(--_border-radius---md, 4px)',
              boxShadow: 'var(--_box-shadow---md)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
