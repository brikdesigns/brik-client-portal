import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agreement — Brik Designs',
  description: 'Review and sign your agreement from Brik Designs.',
  robots: { index: false, follow: false },
};

export default function AgreementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
