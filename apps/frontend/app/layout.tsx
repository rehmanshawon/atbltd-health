export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Sustho Thaki BD Ltd (STBL)',
  description: 'Healthcare support from Sustho Thaki BD Ltd (STBL).',
  icons: {
    icon: '/images/stbl_logo.png',
    shortcut: '/images/stbl_logo.png',
    apple: '/images/stbl_logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        {/* <link rel="icon" href="/images/stbl_logo.png" type="image/png" /> */}
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
