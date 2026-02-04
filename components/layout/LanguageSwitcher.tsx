'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const LanguageSwitcher = ({ locale }: { locale: string }) => {
  const pathname = usePathname()

  const getPathWithLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')
    return `/${newLocale}${pathWithoutLocale}`
  }

  return (
    <div className="flex gap-2">
      <Link
        href={getPathWithLocale('en')}
        className={`px-3 py-1 rounded text-sm font-semibold transition ${
          locale === 'en'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </Link>
      <Link
        href={getPathWithLocale('fr')}
        className={`px-3 py-1 rounded text-sm font-semibold transition ${
          locale === 'fr'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        FR
      </Link>
    </div>
  )
}