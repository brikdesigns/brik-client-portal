import { type HTMLAttributes, type CSSProperties } from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const shimmerKeyframes = `
  @keyframes bds-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const baseStyles: CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--colors--grayscale--lightest, #f3f4f6)',
  backgroundImage: `linear-gradient(
    90deg,
    var(--colors--grayscale--lightest, #f3f4f6) 25%,
    var(--colors--grayscale--lighter, #e5e7eb) 50%,
    var(--colors--grayscale--lightest, #f3f4f6) 75%
  )`,
  backgroundSize: '200% 100%',
  animation: 'bds-skeleton-shimmer 1.5s infinite',
};

const variantDefaults: Record<SkeletonVariant, { width: string; height: string; borderRadius: string }> = {
  text: { width: '100%', height: '1em', borderRadius: '4px' },
  circular: { width: '40px', height: '40px', borderRadius: '50%' },
  rectangular: { width: '100%', height: '140px', borderRadius: 'var(--_border-radius---md, 8px)' },
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantStyle = variantDefaults[variant];

  const combinedStyles: CSSProperties = {
    ...baseStyles,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : variantStyle.width,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : variantStyle.height,
    borderRadius: variantStyle.borderRadius,
    ...style,
  };

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div
        role="status"
        aria-label="Loading"
        aria-live="polite"
        className={className || undefined}
        style={combinedStyles}
        {...props}
      />
    </>
  );
}
