import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  BRAND,
  fontFamily,
} from './_components/layout';

interface NewsletterEmailProps {
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export default function NewsletterEmail({
  recipientName,
  subject,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: NewsletterEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : '';

  return (
    <BrikEmailLayout preview={subject}>
      <EmailHeading>{subject}</EmailHeading>
      {greeting && <Text style={styles.text}>{greeting}</Text>}
      {/* bodyHtml is pre-formatted HTML from the admin */}
      <Text
        style={styles.text}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {ctaLabel && ctaUrl && (
        <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
      )}
    </BrikEmailLayout>
  );
}

const styles = {
  text: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 24px',
  } as React.CSSProperties,
};
