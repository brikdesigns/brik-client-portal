import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  BRAND,
  SITE_URL,
  fontFamily,
} from './_components/layout';

interface AnalysisCompleteEmailProps {
  recipientName?: string;
  companyName: string;
  companySlug: string;
}

export default function AnalysisCompleteEmail({
  recipientName,
  companyName,
  companySlug,
}: AnalysisCompleteEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const resultsUrl = `${SITE_URL}/admin/reporting/${companySlug}`;

  return (
    <BrikEmailLayout
      preview={`Marketing analysis is ready for ${companyName}`}
    >
      <EmailHeading>
        Marketing analysis is complete for {companyName}
      </EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        The marketing analysis is available for{' '}
        <strong>{companyName}</strong>.
      </Text>
      <EmailButton href={resultsUrl}>View results</EmailButton>
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
