import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { ReportStatusBadge } from '@/components/report-badges';
import { AnalyzeButton } from '@/components/analyze-button';
import { ReportContent } from '@/components/report-content';
import { REPORT_TYPE_LABELS, type ReportType } from '@/lib/analysis/report-config';

interface Props {
  params: Promise<{ slug: string; reportType: string }>;
}

export default async function ReportDetailPage({ params }: Props) {
  const { slug, reportType } = await params;

  const supabase = createClient();

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('companies')
    .select('id, name, slug, industry, website_url')
    .eq('slug', slug)
    .single();

  if (clientError || !client) notFound();

  // Fetch report set
  const { data: reportSet } = await supabase
    .from('report_sets')
    .select('id')
    .eq('company_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportSet) notFound();

  // Fetch the specific report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, report_type, status, score, max_score, tier, opportunities_text, created_at')
    .eq('report_set_id', reportSet.id)
    .eq('report_type', reportType)
    .single();

  if (reportError || !report) notFound();

  // Fetch report items
  const { data: items } = await supabase
    .from('report_items')
    .select('id, category, status, score, rating, total_reviews, feedback_summary, notes, metadata')
    .eq('report_id', report.id)
    .order('sort_order', { ascending: true });

  const allItems = (items ?? []) as Array<{
    id: string;
    category: string;
    status: string;
    score: number | null;
    rating: number | null;
    total_reviews: number | null;
    feedback_summary: string | null;
    notes: string | null;
    metadata: Record<string, unknown>;
  }>;
  const reportLabel = REPORT_TYPE_LABELS[reportType as ReportType] || reportType;

  // Count scored vs total items for progress display
  const scoredCount = allItems.filter((i) => i.score !== null).length;

  return (
    <div>
      <PageHeader
        title={reportLabel}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Reporting', href: '/admin/reporting' },
              { label: client.name, href: `/admin/reporting/${slug}` },
              { label: reportLabel },
            ]}
          />
        }
        metadata={[
          {
            label: 'Industry',
            value: client.industry
              ? client.industry.charAt(0).toUpperCase() + client.industry.slice(1).replace('-', ' ')
              : 'General',
          },
          {
            label: 'Status',
            value: <ReportStatusBadge status={report.status} />,
          },
          {
            label: 'Progress',
            value: `${scoredCount} of ${allItems.length} items scored`,
          },
        ]}
        actions={
          <AnalyzeButton
            reportId={report.id}
            reportType={reportType}
          />
        }
      />

      <ReportContent
        report={{
          id: report.id,
          score: report.score,
          max_score: report.max_score,
          tier: report.tier,
          opportunities_text: report.opportunities_text,
        }}
        items={allItems}
        reportType={reportType as ReportType}
        reportSetId={reportSet.id}
      />
    </div>
  );
}
