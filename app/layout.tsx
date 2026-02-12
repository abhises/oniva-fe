import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import "leaflet/dist/leaflet.css";


export const metadata: Metadata = {
  title: 'ONIVA - Your Personal Driver',
  description: 'On-demand personal driver service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}