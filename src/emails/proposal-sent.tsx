import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  BRAND,
  fontFamily,
} from './_components/layout';

interface ProposalSentEmailProps {
  recipientName?: string;
  companyName: string;
  proposalUrl: string;
}

export default function ProposalSentEmail({
  recipientName,
  companyName,
  proposalUrl,
}: ProposalSentEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`Your proposal from Brik Designs is ready — ${companyName}`}>
      <EmailHeading>Your proposal is ready</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        We&apos;ve prepared a proposal for <strong>{companyName}</strong>. Click
        below to review the details, scope, and pricing.
      </Text>
      <EmailButton href={proposalUrl}>View proposal</EmailButton>
      <Text style={styles.muted}>
        This link is unique to your proposal and does not require a login.
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
