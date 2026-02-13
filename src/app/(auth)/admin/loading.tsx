export default function AdminLoading() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            height: '28px',
            width: '180px',
            backgroundColor: 'var(--_color---border--secondary, #e0e0e0)',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '280px',
            backgroundColor: 'var(--_color---border--secondary, #e0e0e0)',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Cards skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '100px',
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
