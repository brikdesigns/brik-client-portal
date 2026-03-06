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

interface PaymentReceivedEmailProps {
  recipientName?: string;
  invoiceDescription: string;
  formattedAmount: string;
}

export default function PaymentReceivedEmail({
  recipientName,
  invoiceDescription,
  formattedAmount,
}: PaymentReceivedEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`Payment received — ${formattedAmount}`}>
      <EmailHeading>Payment received</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        We&apos;ve received your payment of <strong>{formattedAmount}</strong>{' '}
        for <strong>{invoiceDescription}</strong>.
      </Text>
      <Text style={styles.text}>
        Thank you for your prompt payment. You can view your full payment
        history in the client portal.
      </Text>
      <EmailButton href={`${SITE_URL}/dashboard/payments`}>
        View payments
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
