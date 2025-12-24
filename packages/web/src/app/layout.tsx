import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vindicate NYC - Financial Recovery & Legal Case Management',
  description: 'Open-source platform for navigating debt disputes, tax recovery, and arbitration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
