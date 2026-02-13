interface ServiceBadgeProps {
  category: string; // slug: brand, marketing, information, product, service
  size?: number;
}

const categoryConfig: Record<string, { token: string; label: string }> = {
  brand: { token: 'yellow', label: 'Brand' },
  marketing: { token: 'green', label: 'Marketing' },
  information: { token: 'blue', label: 'Information' },
  product: { token: 'purple', label: 'Product' },
  service: { token: 'orange', label: 'Service' },
};

export function ServiceBadge({ category, size = 28 }: ServiceBadgeProps) {
  const config = categoryConfig[category] ?? { token: 'orange', label: category };

  return (
    <div
      title={config.label}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        backgroundColor: `var(--services--${config.token})`,
        flexShrink: 0,
      }}
    />
  );
}

export function ServiceCategoryLabel({ category }: { category: string }) {
  const config = categoryConfig[category] ?? { token: 'orange', label: category };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ServiceBadge category={category} size={12} />
      <span
        style={{
          fontFamily: 'var(--_typography---font-family--label)',
          fontSize: '12px',
          fontWeight: 500,
          color: `var(--services--${config.token}-dark)`,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

export { categoryConfig };
