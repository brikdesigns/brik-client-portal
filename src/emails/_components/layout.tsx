import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const BRAND = {
  primary: '#E35335',
  textPrimary: '#1B1B1B',
  textMuted: '#828282',
  bgPage: '#f2f2f2',
  bgSurface: '#ffffff',
};

const LOGO_URL = 'https://portal.brikdesigns.com/images/brik-logo.svg';
const SITE_URL = 'https://portal.brikdesigns.com';

const fontFamily =
  "'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

interface BrikEmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function BrikEmailLayout({ preview, children }: BrikEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Verdana', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrJJfecg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Verdana', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Verdana', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        {/* White card body */}
        <Container style={styles.card}>
          <Section style={styles.content}>{children}</Section>
        </Container>

        {/* Footer on gray background */}
        <Container style={styles.footerContainer}>
          <Section style={styles.footer}>
            <Img
              src={LOGO_URL}
              width="120"
              alt="Brik Designs"
              style={styles.footerLogo}
            />

            <Text style={styles.footerSocial}>
              <Link href="https://www.instagram.com/brik.designs" style={styles.socialLink}>
                Instagram
              </Link>
              {'  '}
              <Link href="https://www.linkedin.com/company/brikdesigns" style={styles.socialLink}>
                LinkedIn
              </Link>
              {'  '}
              <Link href="https://www.facebook.com/brikdesigns" style={styles.socialLink}>
                Facebook
              </Link>
            </Text>

            <Hr style={styles.footerDivider} />

            <Text style={styles.footerText}>
              We&apos;re located in Palm Beach, Florida
            </Text>
            <Text style={styles.footerText}>
              &copy; {new Date().getFullYear()} Brik Designs, Inc. All rights
              reserved.
            </Text>
            <Text style={styles.footerText}>
              <Link href={`${SITE_URL}/preferences`} style={styles.footerLink}>
                Manage your preferences
              </Link>
              {' or you can '}
              <Link href={`${SITE_URL}/unsubscribe`} style={styles.footerLink}>
                unsubscribe
              </Link>
              {' from emails.'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Shared sub-components                                               */
/* ------------------------------------------------------------------ */

interface EmailHeadingProps {
  children: React.ReactNode;
}

export function EmailHeading({ children }: EmailHeadingProps) {
  return <Text style={styles.heading}>{children}</Text>;
}

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Link href={href} style={styles.button}>
      {children}
    </Link>
  );
}

interface EmailInfoBoxProps {
  children: React.ReactNode;
}

export function EmailInfoBox({ children }: EmailInfoBoxProps) {
  return <Section style={styles.infoBox}>{children}</Section>;
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = {
  body: {
    backgroundColor: BRAND.bgPage,
    fontFamily,
    margin: '0',
    padding: '40px 20px',
  } as React.CSSProperties,

  card: {
    backgroundColor: BRAND.bgSurface,
    borderRadius: '8px',
    maxWidth: '600px',
    overflow: 'hidden' as const,
  } as React.CSSProperties,

  content: {
    padding: '40px',
  } as React.CSSProperties,

  heading: {
    color: BRAND.textPrimary,
    fontFamily,
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '1.1',
    margin: '0 0 16px',
  } as React.CSSProperties,

  button: {
    backgroundColor: BRAND.primary,
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontFamily,
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '1.1',
    padding: '14px 24px',
    textDecoration: 'none',
  } as React.CSSProperties,

  infoBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    margin: '24px 0',
    padding: '12px 16px',
  } as React.CSSProperties,

  footerContainer: {
    maxWidth: '600px',
    padding: '0',
  } as React.CSSProperties,

  footer: {
    padding: '48px 40px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  footerLogo: {
    display: 'block',
    margin: '0 auto 24px',
  } as React.CSSProperties,

  footerSocial: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 8px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  socialLink: {
    color: BRAND.textMuted,
    textDecoration: 'none',
  } as React.CSSProperties,

  footerDivider: {
    borderColor: '#e0e0e0',
    borderTop: '1px solid #e0e0e0',
    margin: '24px 0',
  } as React.CSSProperties,

  footerText: {
    color: BRAND.textMuted,
    fontFamily,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 4px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  footerLink: {
    color: BRAND.textMuted,
    textDecoration: 'underline',
  } as React.CSSProperties,
};

/* Re-export brand constants for use in templates */
export { BRAND, SITE_URL, fontFamily };
