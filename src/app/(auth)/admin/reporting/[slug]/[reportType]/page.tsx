import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string; reportType: string }>;
}

/**
 * Redirect old reporting routes to company-scoped routes.
 * Keeps bookmarks and shared links working.
 */
export default async function ReportDetailRedirect({ params }: Props) {
  const { slug, reportType } = await params;
  redirect(`/admin/companies/${slug}/reporting/${reportType}`);
}
