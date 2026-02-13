import { Poppins } from 'next/font/google';

// Brik Designs brand font (BDS primitive: --font-family--body/heading/display/label)
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});
