import { PageHeader as BDSPageHeader, type PageHeaderProps, type MetadataItem } from '@bds/components/ui/PageHeader/PageHeader';
import { Breadcrumb, type BreadcrumbItem } from '@bds/components/ui/Breadcrumb/Breadcrumb';

// Re-export types for convenience
export type { PageHeaderProps, MetadataItem, BreadcrumbItem };

// Re-export Breadcrumb for easy access
export { Breadcrumb };

/**
 * Portal-specific PageHeader wrapper
 *
 * Wraps the BDS PageHeader component and removes the default 80px horizontal padding.
 * The portal layouts (admin + dashboard) already provide 32px padding on the main element,
 * so we strip the BDS horizontal padding to prevent double-padding (32px + 80px = 112px).
 *
 * Adds vertical padding (padding-lg) for consistent spacing.
 *
 * This wrapper allows all consuming pages to continue importing from '@/components/page-header'
 * without needing to change import paths.
 */
export function PageHeader(props: PageHeaderProps) {
  return (
    <BDSPageHeader
      {...props}
      style={{
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 'var(--_space---padding--lg)',
        paddingBottom: 'var(--_space---padding--lg)',
        ...props.style,
      }}
    />
  );
}
