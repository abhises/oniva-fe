'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18next}>
      {children}
      <Toaster position="top-right" />
    </I18nextProvider>
  );
}