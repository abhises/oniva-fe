'use client';

import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import Backend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const languages = ['en', 'fr'];
const defaultLanguage = 'en';

i18next
  .use(LanguageDetector)
  .use(
    Backend((lng:any, ns:any) => 
      import(`../public/locales/${lng}/${ns}.json`)
    )
  )
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLanguage,
    supportedLngs: languages,
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path'],
      lookupFromPathIndex: 0,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;
