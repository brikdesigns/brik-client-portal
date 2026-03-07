import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  BRAND,
  fontFamily,
} from './_components/layout';

interface AgreementSentEmailProps {
  recipientName?: string;
  companyName: string;
  agreementTitle: string;
  agreementUrl: string;
}

export default function AgreementSentEmail({
  recipientName,
  companyName,
  agreementTitle,
  agreementUrl,
}: AgreementSentEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`${companyName} — Your agreement from Brik Designs is ready to sign`}>
      <EmailHeading>Your agreement is ready</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        We&apos;ve prepared a <strong>{agreementTitle}</strong> for{' '}
        <strong>{companyName}</strong>. Please review and sign at your earliest
        convenience.
      </Text>
      <EmailButton href={agreementUrl}>Review &amp; sign</EmailButton>
      <Text style={styles.muted}>
        This link is unique to your agreement and does not require a login.
      </Text>
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
  muted: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '16px 0 0',
  } as React.CSSProperties,
};
