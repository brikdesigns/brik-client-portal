import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Tag } from '@bds/components/ui/Tag/Tag';
import { Button } from '@bds/components/ui/Button/Button';
import { TextLink } from '@bds/components/ui/TextLink/TextLink';
import { PageHeader, Breadcrumb } from '@/components/page-header';
import { font, color, gap } from '@/lib/tokens';
import { formatPhone } from '@/lib/format';

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
    fontFamily: font.family.label,
    fontSize: font.size.body.sm,
    fontWeight: font.weight.medium,
    color: color.text.muted,
    margin: 0,
  };

  const fieldValueStyle = {
    fontFamily: font.family.body,
    fontSize: font.size.body.sm,
    color: color.text.primary,
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
          <div style={{ display: 'flex', gap: gap.md }}>
            <Button variant="secondary" size="sm" asLink href={`/admin/contacts/${contact.id}/edit`}>
              Edit
            </Button>
          </div>
        }
        metadata={[
          ...(contact.is_primary ? [{
            label: '',
            value: (
              <Tag size="sm" style={{ color: color.text.muted }}>Primary</Tag>
            ),
          }] : []),
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xl }}>
        {/* Role + dates row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Role</p>
            <p style={fieldValueStyle}>
              {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
            </p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Date added</p>
            <p style={fieldValueStyle}>
              {new Date(contact.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Last updated</p>
            <p style={fieldValueStyle}>
              {new Date(contact.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: gap.xl }}>
          <div>
            <p style={fieldLabelStyle}>Email</p>
            <p style={fieldValueStyle}>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} style={{ color: color.system.link, textDecoration: 'none' }}>
                  {contact.email}
                </a>
              ) : '—'}
            </p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Phone</p>
            <p style={fieldValueStyle}>{contact.phone ? formatPhone(contact.phone) : '—'}</p>
          </div>
          <div>
            <p style={fieldLabelStyle}>Job title</p>
            <p style={fieldValueStyle}>{contact.title || '—'}</p>
          </div>
        </div>

        {/* Notes */}
        {contact.notes && (
          <div>
            <p style={fieldLabelStyle}>Notes</p>
            <p
              style={{
                ...fieldValueStyle,
                color: color.text.secondary,
                lineHeight: font.lineHeight.relaxed,
                whiteSpace: 'pre-wrap',
              }}
            >
              {contact.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
