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
  promoted?: boolean;
  warnings?: string[];
}

export default function ProposalAcceptedEmail({
  recipientName,
  companyName,
  companySlug,
  proposalId,
  promoted,
  warnings,
}: ProposalAcceptedEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`${companyName} signed their proposal`}>
      <EmailHeading>Proposal signed</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        <strong>{companyName}</strong> signed their proposal.
        {promoted === true && ' They have been promoted to an active client.'}
        {promoted === false && ' They were not auto-promoted — check agreements and services.'}
      </Text>

      {warnings && warnings.length > 0 && (
        <div style={styles.warningBox}>
          <Text style={styles.warningTitle}>Action needed</Text>
          {warnings.map((w, i) => (
            <Text key={i} style={styles.warningItem}>• {w}</Text>
          ))}
          <Text style={styles.warningHint}>
            Visit the company page to resolve these issues manually.
          </Text>
        </div>
      )}

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
  warningBox: {
    backgroundColor: '#FFF8E1',
    border: '1px solid #F6C647',
    borderRadius: '8px',
    padding: '16px',
    margin: '0 0 24px',
  } as React.CSSProperties,
  warningTitle: {
    color: '#8B6914',
    fontFamily,
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 8px',
  } as React.CSSProperties,
  warningItem: {
    color: '#5D4A0E',
    fontFamily,
    fontSize: '14px',
    lineHeight: '1.4',
    margin: '0 0 4px',
  } as React.CSSProperties,
  warningHint: {
    color: '#8B6914',
    fontFamily,
    fontSize: '13px',
    margin: '8px 0 0',
  } as React.CSSProperties,
};
