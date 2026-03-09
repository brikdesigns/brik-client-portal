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

interface ProposalAcceptedEmailProps {
  recipientName?: string;
  companyName: string;
  companySlug: string;
  proposalId: string;
}

export default function ProposalAcceptedEmail({
  recipientName,
  companyName,
  companySlug,
  proposalId,
}: ProposalAcceptedEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`${companyName} signed their proposal`}>
      <EmailHeading>Proposal signed</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        <strong>{companyName}</strong> signed their proposal.
      </Text>
      <EmailButton href={`${SITE_URL}/admin/companies/${companySlug}/proposals/${proposalId}`}>
        View proposal
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
};
