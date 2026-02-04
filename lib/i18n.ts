import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import Backend from 'i18next-resources-to-backend';

const languages = ['en', 'fr'];
const defaultLanguage = 'en';

i18next
  .use(Backend({
    loadPath: '/locales/{{lng}}/common.json',
  }))
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLanguage,
    supportedLngs: languages,
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;