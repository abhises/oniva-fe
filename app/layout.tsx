import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import "leaflet/dist/leaflet.css";
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600'],
});

const svgFavicon = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230A0A0A"/><circle cx="50" cy="50" r="30" fill="none" stroke="%23FFFFFF" stroke-width="8"/><circle cx="50" cy="50" r="18" fill="%233B82F6"/></svg>`;

export const metadata: Metadata = {
  title: 'ONIVA - Your Personal Driver',
  description: 'On-demand personal driver service',
  icons: {
    icon: svgFavicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={outfit.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}