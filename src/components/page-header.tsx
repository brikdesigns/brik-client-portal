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
 * so we strip the BDS default padding to prevent double-padding (32px + 80px = 112px).
 *
 * This wrapper allows all consuming pages to continue importing from '@/components/page-header'
 * without needing to change import paths.
 */
export function PageHeader(props: PageHeaderProps) {
  return <BDSPageHeader {...props} style={{ padding: 0, ...props.style }} />;
}
