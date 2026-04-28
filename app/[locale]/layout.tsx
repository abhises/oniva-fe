import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import React from 'react';
import { Header } from '@/components/layout/Header';
import { Providers } from '@/components/providers';
import { Outfit } from 'next/font/google';
import { ONIVA_FAVICON_SVG } from '@/lib/constants';

import '../globals.css';
import "leaflet/dist/leaflet.css";

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'ONIVA - Your Personal Driver',
  description: 'Premium On-demand personal driver service.',
  icons: {
    icon: ONIVA_FAVICON_SVG,
  },
  openGraph: {
    title: 'ONIVA - Your Personal Driver',
    description: 'Premium On-demand personal driver service.',
    siteName: 'ONIVA Transport',
    images: [{
      url: '/social-preview.png',
      width: 1200,
      height: 630,
      alt: 'ONIVA App Preview'
    }]
  }
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false 
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);

  return (
    <html lang={locale} className={outfit.variable}>
      <body className={outfit.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header locale={locale} />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
