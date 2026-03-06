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

interface ProjectUpdateEmailProps {
  recipientName?: string;
  companyName: string;
  projectName: string;
  projectStatus: string;
  updateMessage: string;
}

export default function ProjectUpdateEmail({
  recipientName,
  companyName,
  projectName,
  projectStatus,
  updateMessage,
}: ProjectUpdateEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';

  return (
    <BrikEmailLayout preview={`Update on your project: ${projectName}`}>
      <EmailHeading>Project update: {projectName}</EmailHeading>
      <Text style={styles.text}>{greeting}</Text>
      <Text style={styles.text}>
        Here&apos;s an update on the <strong>{projectName}</strong> project for{' '}
        {companyName}:
      </Text>
      <EmailInfoBox>
        <Text style={styles.statusLabel}>Status: {projectStatus}</Text>
        <Text style={styles.updateText}>{updateMessage}</Text>
      </EmailInfoBox>
      <EmailButton href={`${SITE_URL}/dashboard`}>View in portal</EmailButton>
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
  statusLabel: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '12px',
    letterSpacing: '0.5px',
    lineHeight: '1.1',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  updateText: {
    color: '#333333',
    fontFamily,
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0',
  } as React.CSSProperties,
};
