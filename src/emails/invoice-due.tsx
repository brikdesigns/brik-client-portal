import { Text } from '@react-email/components';
import * as React from 'react';
import {
  BrikEmailLayout,
  EmailButton,
  EmailHeading,
  EmailInfoBox,
  BRAND,
  fontFamily,
} from './_components/layout';

interface InvoiceDueEmailProps {
  recipientName?: string;
  companyName: string;
  invoiceDescription: string;
  formattedAmount: string;
  formattedDate: string;
  invoiceUrl?: string;
}

export default function InvoiceDueEmail({
  recipientName,
  companyName,
  invoiceDescription,
  formattedAmount,
  formattedDate,
  invoiceUrl,
}: InvoiceDueEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`Invoice due: ${invoiceDescription} — ${formattedAmount}`}>
      <EmailHeading>Invoice due</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        This is a reminder that the following invoice for{' '}
        <strong>{companyName}</strong> is due:
      </Text>
      <EmailInfoBox>
        <Text style={styles.infoTitle}>{invoiceDescription}</Text>
        <Text style={styles.infoDetail}>
          Amount: <strong>{formattedAmount}</strong> &middot; Due:{' '}
          {formattedDate}
        </Text>
      </EmailInfoBox>
      {invoiceUrl && (
        <EmailButton href={invoiceUrl}>View invoice</EmailButton>
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
    margin: '0 0 24px',
  } as React.CSSProperties,
  infoTitle: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '1.5',
    margin: '0 0 4px',
  } as React.CSSProperties,
  infoDetail: {
    color: '#555555',
    fontFamily,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
  } as React.CSSProperties,
};
