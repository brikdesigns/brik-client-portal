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

interface WelcomeToBrikEmailProps {
  recipientName?: string;
  companyName: string;
  setupUrl?: string;
}

export default function WelcomeToBrikEmail({
  recipientName,
  companyName,
  setupUrl,
}: WelcomeToBrikEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`Welcome to Brik, ${companyName}!`}>
      <EmailHeading>Welcome</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        Thank you again for your time on our proposal call — we&apos;re
        excited about what we can build together.
      </Text>
      <Text style={styles.text}>
        To get started, set up your portal account below. This gives you
        access to your project dashboard, invoices, and reports.
      </Text>
      <Text style={styles.text}>
        If you have any questions, just reply directly to this email. :)
      </Text>
      <Text style={styles.text}>
        Grateful for the opportunity to partner with you.
      </Text>
      {setupUrl ? (
        <EmailButton href={setupUrl}>Set up your account</EmailButton>
      ) : (
        <EmailButton href={`${SITE_URL}/welcome`}>Get started</EmailButton>
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
    margin: '0 0 16px',
  } as React.CSSProperties,
};
