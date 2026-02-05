import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import React from 'react';

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);

  return (
    <div>
      <Header locale={locale} />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
