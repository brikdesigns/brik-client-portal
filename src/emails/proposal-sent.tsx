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
        Brik Designs has prepared a proposal for <strong>{companyName}</strong>.
        Inside you&apos;ll find a summary of the project scope, timeline, and
        investment — everything you need to make an informed decision.
      </Text>
      <Text style={styles.text}>
        Once accepted, here&apos;s what happens next:
      </Text>
      <Text style={styles.listItem}>
        &bull;&nbsp;&nbsp;You&apos;ll receive a welcome email with your next steps
      </Text>
      <Text style={styles.listItem}>
        &bull;&nbsp;&nbsp;We&apos;ll schedule a kickoff call to align on goals and timeline
      </Text>
      <Text style={styles.listItem}>
        &bull;&nbsp;&nbsp;Your dedicated project portal will be set up and ready to go
      </Text>
      <EmailButton href={proposalUrl}>View proposal</EmailButton>
      <Text style={styles.muted}>
        This link is unique to your proposal and does not require a login.
        If you have questions, just reply to this email.
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
  muted: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '24px 0 0',
  } as React.CSSProperties,
};
