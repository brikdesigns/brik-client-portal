import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  EmailInfoBox,
  BRAND,
  SITE_URL,
  fontFamily,
} from './_components/layout';

interface AgreementSignedEmailProps {
  companyName: string;
  agreementTitle: string;
  signedByName: string;
  signedByEmail: string;
  signedAt: string;
  companySlug: string;
}

export default function AgreementSignedEmail({
  companyName,
  agreementTitle,
  signedByName,
  signedByEmail,
  signedAt,
  companySlug,
}: AgreementSignedEmailProps) {
  const formattedDate = new Date(signedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <BrikEmailLayout preview={`${companyName} signed their ${agreementTitle}`}>
      <EmailHeading>Agreement signed</EmailHeading>
      <Text style={styles.text}>
        <strong>{companyName}</strong> has signed their{' '}
        <strong>{agreementTitle}</strong>.
      </Text>
      <EmailInfoBox>
        <Text style={styles.infoLabel}>Signed by</Text>
        <Text style={styles.infoValue}>
          {signedByName} ({signedByEmail})
        </Text>
        <Text style={styles.infoLabel}>Date</Text>
        <Text style={styles.infoValue}>{formattedDate}</Text>
      </EmailInfoBox>
      <EmailButton href={`${SITE_URL}/admin/companies/${companySlug}`}>
        View company
      </EmailButton>
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
  infoLabel: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '12px',
    letterSpacing: '0.5px',
    lineHeight: '1.1',
    margin: '0 0 2px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  infoValue: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 12px',
  } as React.CSSProperties,
};
