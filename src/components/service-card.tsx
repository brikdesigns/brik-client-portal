import { ServiceBadge } from '@/components/service-badge';

interface ServiceCardProps {
  name: string;
  description?: string | null;
  categorySlug: string;
  serviceType?: string;
  status?: string;
  href?: string;
}

export function ServiceCard({
  name,
  description,
  categorySlug,
  serviceType,
  status,
  href,
}: ServiceCardProps) {
  const isRecurring = serviceType === 'recurring';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: 'var(--_color---surface--secondary, #f2f2f2)',
        borderRadius: '8px',
      }}
    >
      <ServiceBadge category={categorySlug} serviceName={name} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--_typography---font-family--label)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </p>
        {description && (
          <p
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '14px',
              color: 'var(--_color---text--secondary)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {isRecurring && (
          <span
            style={{
              fontFamily: 'var(--_typography---font-family--label)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--_color---text--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Monthly
          </span>
        )}
        {status && status !== 'active' && (
          <span
            style={{
              fontFamily: 'var(--_typography---font-family--label)',
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: status === 'paused'
                ? 'var(--services--yellow-light)'
                : 'var(--_color---background--secondary)',
              color: status === 'paused'
                ? 'var(--services--yellow-dark)'
                : 'var(--_color---text--secondary)',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
        {href && (
          <a
            href={href}
            style={{
              fontFamily: 'var(--_typography---font-family--body)',
              fontSize: '13px',
              color: 'var(--_color---system--link)',
              textDecoration: 'none',
            }}
          >
            View
          </a>
        )}
      </div>
    </div>
  );
}
