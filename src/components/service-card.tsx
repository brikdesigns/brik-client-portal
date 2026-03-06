import { ServiceBadge } from '@/components/service-badge';
import { font, color, gap, border, space } from '@/lib/tokens';

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
        gap: gap.md,
        padding: `${space.md} ${space.lg}`,
        backgroundColor: color.surface.secondary,
        borderRadius: border.radius.md,
      }}
    >
      <ServiceBadge category={categorySlug} serviceName={name} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: font.family.label,
            fontSize: font.size.label.md,
            fontWeight: font.weight.semibold,
            color: color.text.primary,
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
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              color: color.text.secondary,
              margin: `${gap.tiny} 0 0`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, flexShrink: 0 }}>
        {isRecurring && (
          <span
            style={{
              fontFamily: font.family.label,
              fontSize: font.size.body.xs,
              fontWeight: font.weight.medium,
              color: color.text.muted,
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
              fontFamily: font.family.label,
              fontSize: font.size.body.xs,
              fontWeight: font.weight.medium,
              padding: `${gap.tiny} ${gap.md}`,
              borderRadius: border.radius.sm,
              backgroundColor: status === 'paused'
                ? 'var(--services--yellow-light)'
                : color.background.secondary,
              color: status === 'paused'
                ? 'var(--services--yellow-dark)'
                : color.text.secondary,
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
        {href && (
          <a
            href={href}
            style={{
              fontFamily: font.family.body,
              fontSize: font.size.body.sm,
              color: color.system.link,
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
