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

interface ProposalAcceptedEmailProps {
  companyName: string;
  acceptedByEmail: string;
  acceptedAt: string;
  companySlug: string;
}

export default function ProposalAcceptedEmail({
  companyName,
  acceptedByEmail,
  acceptedAt,
  companySlug,
}: ProposalAcceptedEmailProps) {
  const formattedDate = new Date(acceptedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <BrikEmailLayout preview={`${companyName} accepted their proposal`}>
      <EmailHeading>Proposal accepted</EmailHeading>
      <Text style={styles.text}>
        <strong>{companyName}</strong> has accepted their proposal.
      </Text>
      <EmailInfoBox>
        <Text style={styles.infoLabel}>Accepted by</Text>
        <Text style={styles.infoValue}>{acceptedByEmail}</Text>
        <Text style={styles.infoLabel}>Date</Text>
        <Text style={styles.infoValue}>{formattedDate}</Text>
      </EmailInfoBox>
      <Text style={styles.text}>
        Agreements have been auto-generated and are ready for review.
      </Text>
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
