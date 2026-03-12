import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proposal — Brik Designs',
  description: 'Review and accept your proposal from Brik Designs.',
  robots: { index: false, follow: false },
};

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
