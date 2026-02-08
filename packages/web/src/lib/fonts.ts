import { Inter } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // Variable font with weights from 100-900
  weight: ['400', '500', '600', '700'],
  // Preload Latin subset for best performance
  preload: true,
});
