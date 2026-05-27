import type { Metadata, Viewport } from 'next';
import { Inter, Amiri } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfaf3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'),
  title: {
    default: 'Ibadah Admin — Operations Console',
    template: '%s · Ibadah Admin',
  },
  description: 'Internal administration console for the Ibadah application.',
  robots: { index: false, follow: false },
  applicationName: 'Ibadah Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${amiri.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
