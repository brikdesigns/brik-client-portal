'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            backgroundColor: '#E35335',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
