'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';

export const useLocale = () => {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const { t, i18n } = useTranslation();

  const changeLocale = useCallback(
    (newLocale: string) => {
      i18n.changeLanguage(newLocale);
      // Redirect to new locale
      const currentPath = window.location.pathname;
      const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '');
      window.location.href = `/${newLocale}${pathWithoutLocale}`;
    },
    [i18n]
  );

  return useMemo(() => ({
    locale,
    t,
    changeLocale,
    i18n,
  }), [locale, t, changeLocale, i18n]);
};