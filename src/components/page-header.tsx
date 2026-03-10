import { PageHeader as BDSPageHeader, type PageHeaderProps, type MetadataItem } from '@bds/components/ui/PageHeader/PageHeader';
import { Breadcrumb, type BreadcrumbItem } from '@bds/components/ui/Breadcrumb/Breadcrumb';
import { space } from '@/lib/tokens';

// Re-export types for convenience
export type { PageHeaderProps, MetadataItem, BreadcrumbItem };

// Re-export Breadcrumb for easy access
export { Breadcrumb };

/**
 * Portal-specific PageHeader wrapper
 *
 * Wraps the BDS PageHeader component:
 * - Removes default 80px horizontal padding (portal layouts provide their own)
 * - Title scaled to heading-md via component-tier CSS in globals.css
 *   (.bds-page-header-title { font-size: var(--heading-md) })
 */
export function PageHeader(props: PageHeaderProps) {
  return (
    <BDSPageHeader
      {...props}
      style={{
        ...props.style,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: space.xl,
        paddingBottom: space.xl,
      }}
    />
  );
}
