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

interface InviteEmailProps {
  inviteeName?: string;
  inviterName?: string;
}

export default function InviteEmail({
  inviteeName,
  inviterName,
}: InviteEmailProps) {
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi,';
  const invitedBy = inviterName ? ` ${inviterName} from` : '';

  return (
    <BrikEmailLayout preview="You've been invited to the Brik Designs client portal">
      <EmailHeading>Welcome to Brik Designs</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        {invitedBy} Brik Designs has invited you to the client portal, where you
        can track your projects, view invoices, and stay up to date.
      </Text>
      <Text style={styles.text}>
        Check your inbox for a separate email from Supabase with your login
        link. Use it to set your password and access your account.
      </Text>
      <EmailButton href={`${SITE_URL}/login`}>Sign in to your portal</EmailButton>
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
