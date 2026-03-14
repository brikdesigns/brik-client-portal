import { EmptyState as BdsEmptyState } from '@bds/components/ui/EmptyState/EmptyState';
import { LinkButton } from '@bds/components/ui/Button/LinkButton';

interface PortalEmptyStateProps {
  /** Primary heading */
  title: string;
  /** Optional supporting text */
  description?: string;
  /** Optional CTA button */
  action?: { label: string; href: string };
  /** Render inside a Card with transparent bg (default: true) */
  inline?: boolean;
}

/**
 * Portal EmptyState wrapper — renders BDS EmptyState.
 * Use `inline` (default) for embedding inside existing Card containers.
 * Set `inline={false}` for standalone use with full BDS styling.
 */
export function EmptyState({
  title,
  description,
  action,
  inline = true,
}: PortalEmptyStateProps) {
  return (
    <BdsEmptyState
      title={title}
      description={description}
      style={
        inline
          ? { backgroundColor: 'transparent', border: 'none', minHeight: 'auto' }
          : undefined
      }
    >
      {action && (
        <LinkButton variant="primary" size="sm" href={action.href}>
          {action.label}
        </LinkButton>
      )}
    </BdsEmptyState>
  );
}
