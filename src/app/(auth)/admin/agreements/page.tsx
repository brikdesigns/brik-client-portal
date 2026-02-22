import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { CardSummary } from '@bds/components/ui/Card/CardSummary';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { AgreementStatusBadge } from '@/components/status-badges';

export default async function AdminAgreementsPage() {
  const supabase = createClient();

  const { data: agreements } = await supabase
    .from('agreements')
    .select(`
      id, type, title, status, token, created_at,
      signed_at, signed_by_name,
      companies(id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const all = agreements ?? [];
  const draft = all.filter((a) => a.status === 'draft');
  const pending = all.filter((a) => a.status === 'sent' || a.status === 'viewed');
  const signed = all.filter((a) => a.status === 'signed');

  type AgreementRow = (typeof all)[number];

  const typeLabel = (type: string) =>
    type === 'baa' ? 'BAA' : 'Marketing';

  return (
    <div>
      <PageHeader
        title="Agreements"
        subtitle={`${all.length} total agreements across all clients.`}
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <CardSummary label="Draft" value={draft.length} />
        <CardSummary label="Pending" value={pending.length} />
        <CardSummary label="Signed" value={signed.length} />
        <CardSummary label="Total" value={all.length} />
      </div>

      {/* Pending agreements */}
      {pending.length > 0 && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: 'var(--_typography---font-family--heading)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--_color---text--primary)',
              margin: '0 0 16px',
            }}
          >
            Pending signature
          </h2>
          <DataTable<AgreementRow>
            data={pending}
            rowKey={(a) => a.id}
            emptyMessage=""
            columns={[
              {
                header: 'Client',
                accessor: (a) => {
                  const client = a.companies as unknown as { id: string; name: string; slug: string } | null;
                  return client ? (
                    <TextLink href={`/admin/companies/${client.slug}`} size="small">
                      {client.name}
                    </TextLink>
                  ) : '—';
                },
                style: { fontWeight: 500 },
              },
              {
                header: 'Title',
                accessor: (a) => a.title,
                style: { color: 'var(--_color---text--primary)' },
              },
              {
                header: 'Type',
                accessor: (a) => <Tag>{typeLabel(a.type)}</Tag>,
              },
              {
                header: 'Status',
                accessor: (a) => <AgreementStatusBadge status={a.status} />,
              },
              {
                header: 'Created',
                accessor: (a) => new Date(a.created_at).toLocaleDateString(),
                style: { color: 'var(--_color---text--secondary)' },
              },
              {
                header: '',
                accessor: (a) => {
                  const client = a.companies as unknown as { slug: string } | null;
                  return client ? (
                    <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${a.id}`}>
                      View
                    </Button>
                  ) : null;
                },
                style: { textAlign: 'right' },
              },
            ]}
          />
        </Card>
      )}

      {/* All agreements */}
      <Card variant="elevated" padding="lg">
        <h2
          style={{
            fontFamily: 'var(--_typography---font-family--heading)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--_color---text--primary)',
            margin: '0 0 16px',
          }}
        >
          All agreements
        </h2>
        <DataTable<AgreementRow>
          data={all}
          rowKey={(a) => a.id}
          emptyMessage="No agreements yet."
          columns={[
            {
              header: 'Client',
              accessor: (a) => {
                const client = a.companies as unknown as { id: string; name: string; slug: string } | null;
                return client ? (
                  <TextLink href={`/admin/companies/${client.slug}`} size="small">
                    {client.name}
                  </TextLink>
                ) : '—';
              },
              style: { fontWeight: 500 },
            },
            {
              header: 'Title',
              accessor: (a) => a.title,
              style: { color: 'var(--_color---text--primary)' },
            },
            {
              header: 'Type',
              accessor: (a) => <Tag>{typeLabel(a.type)}</Tag>,
            },
            {
              header: 'Status',
              accessor: (a) => <AgreementStatusBadge status={a.status} />,
            },
            {
              header: 'Created',
              accessor: (a) => new Date(a.created_at).toLocaleDateString(),
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: 'Signed by',
              accessor: (a) => a.signed_by_name || '—',
              style: { color: 'var(--_color---text--secondary)' },
            },
            {
              header: '',
              accessor: (a) => {
                const client = a.companies as unknown as { slug: string } | null;
                return client ? (
                  <Button variant="secondary" size="sm" asLink href={`/admin/companies/${client.slug}/agreements/${a.id}`}>
                    View
                  </Button>
                ) : null;
              },
              style: { textAlign: 'right' },
            },
          ]}
        />
      </Card>
    </div>
  );
}
