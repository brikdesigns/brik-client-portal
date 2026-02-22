import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@bds/components/ui/Card/Card';
import { Badge } from '@bds/components/ui/Badge/Badge';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader, Breadcrumb } from '@/components/page-header';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      id,
      full_name,
      email,
      phone,
      title,
      role,
      is_primary,
      user_id,
      notes,
      created_at,
      updated_at,
      companies(id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !contact) {
    notFound();
  }

  const company = contact.companies as unknown as { id: string; name: string; slug: string } | null;

  const fieldLabelStyle = {
    fontFamily: 'var(--_typography---font-family--label, var(--_typography---font-family--body))',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--_color---text--secondary)',
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: 'var(--_typography---font-family--body)',
    fontSize: '14px',
    color: 'var(--_color---text--primary)',
    margin: 0,
  };

  return (
    <div>
      <PageHeader
        title={contact.full_name}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Contacts', href: '/admin/contacts' },
              { label: contact.full_name },
            ]}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: 'var(--_space---gap--md)' }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${contact.id}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={[
          {
            label: 'Role',
            value: (
              <Tag size="sm" style={{ color: 'var(--_color---text--muted)' }}>
                {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
              </Tag>
            ),
          },
          ...(contact.is_primary ? [{
            label: '',
            value: (
              <Tag size="sm" style={{ color: 'var(--_color---text--muted)' }}>Primary</Tag>
            ),
          }] : []),
          {
            label: 'Portal',
            value: (
              <Badge status={contact.user_id ? 'positive' : 'neutral'}>
                {contact.user_id ? 'Active' : 'No access'}
              </Badge>
            ),
          },
        ]}
      />

      <Card variant="elevated" padding="lg" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Company */}
          <div>
            <p style={fieldLabelStyle}>Company</p>
            <p style={fieldValueStyle}>
              {company ? (
                <TextLink href={`/admin/companies/${company.slug}`} size="small">
                  {company.name}
                </TextLink>
              ) : '—'}
            </p>
          </div>

          {/* Contact info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p style={fieldLabelStyle}>Email</p>
              <p style={fieldValueStyle}>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} style={{ color: 'var(--_color---system--link)', textDecoration: 'none' }}>
                    {contact.email}
                  </a>
                ) : '—'}
              </p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Phone</p>
              <p style={fieldValueStyle}>{contact.phone || '—'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <p style={fieldLabelStyle}>Title</p>
              <p style={fieldValueStyle}>{contact.title || '—'}</p>
            </div>
            <div>
              <p style={fieldLabelStyle}>Added</p>
              <p style={fieldValueStyle}>
                {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div>
              <p style={fieldLabelStyle}>Notes</p>
              <p
                style={{
                  ...fieldValueStyle,
                  color: 'var(--_color---text--secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {contact.notes}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
