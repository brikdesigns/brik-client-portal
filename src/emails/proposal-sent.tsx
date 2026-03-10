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
    <BrikEmailLayout preview={`Brik Designs sent you a proposal — ${companyName}`}>
      <EmailHeading>Welcome</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        Thank you again for your time on our proposal call — we&apos;re
        excited about what we can build together.
      </Text>
      <Text style={styles.text}>
        Your proposal is ready below. Inside, you&apos;ll be able to review
        everything we discussed. If everything looks good, simply click
        Accept to move forward.
      </Text>
      <Text style={styles.text}>Once accepted:</Text>
      <Text style={styles.listItem}>
        &bull;&nbsp;&nbsp;You&apos;ll automatically receive your agreement and invoice
      </Text>
      <Text style={styles.listItem}>
        &bull;&nbsp;&nbsp;Once completed — we&apos;re officially ready to rock and roll
      </Text>
      <Text style={styles.text}>
        If you have any questions while reviewing, just reply directly to
        this email. :)
      </Text>
      <Text style={styles.text}>
        Grateful for the opportunity to partner with you.
      </Text>
      <EmailButton href={proposalUrl}>Review Proposal</EmailButton>
    </BrikEmailLayout>
  );
}

const styles = {
  text: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 16px',
  } as React.CSSProperties,
  listItem: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '0 0 8px',
    paddingLeft: '8px',
  } as React.CSSProperties,
};
