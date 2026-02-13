import type { Metadata } from 'next';
import { poppins } from '@/lib/fonts';
import { BDSProvider } from '@/components/bds-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brik Client Portal',
  description: 'Brik Designs client portal — track your projects, billing, and metrics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`body ${poppins.variable} ${poppins.className}`}>
        <BDSProvider>
          {children}
        </BDSProvider>
      </body>
    </html>
  );
}
