import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}