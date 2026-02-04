'use client';

import { useLocale } from '@/hooks/useLocale';

export const LanguageSwitcher = () => {
  const { locale, changeLocale } = useLocale();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLocale('en')}
        className={`px-3 py-1 rounded text-sm font-semibold transition ${
          locale === 'en'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLocale('fr')}
        className={`px-3 py-1 rounded text-sm font-semibold transition ${
          locale === 'fr'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        FR
      </button>
    </div>
  );
};