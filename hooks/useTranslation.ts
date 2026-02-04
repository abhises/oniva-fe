'use client'

import { useTranslation as useI18nTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation()
  const params = useParams()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  // Get current locale from URL
  const locale = (params.locale as string) || 'en'

  // Initialize i18n with current locale
  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale).then(() => {
        setIsReady(true)
      })
    } else {
      setIsReady(true)
    }
  }, [locale, i18n])

  // Change language and update URL
  const changeLocale = useCallback(
    (newLocale: string) => {
      // Change i18n language
      i18n.changeLanguage(newLocale)

      // Save to localStorage
      localStorage.setItem('language', newLocale)

      // Update URL
      const currentPath = window.location.pathname
      const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '')
      router.push(`/${newLocale}${pathWithoutLocale}`)
    },
    [i18n, router]
  )

  // Get all available locales
  const getAvailableLocales = useCallback(() => {
    return ['en', 'fr']
  }, [])

  // Get language name in that language
  const getLanguageName = useCallback(
    (locale: string) => {
      const names: Record<string, string> = {
        en: 'English',
        fr: 'Français',
      }
      return names[locale] || locale
    },
    []
  )

  // Translate with fallback
  const translate = useCallback(
    (key: string, defaultValue?: string) => {
      const translated = t(key)
      
      // If translation key not found, return default or key itself
      if (translated === key && defaultValue) {
        return defaultValue
      }
      return translated
    },
    [t]
  )

  // Plural translation
  const pluralize = useCallback(
    (key: string, count: number) => {
      return t(key, { count })
    },
    [t]
  )

  // Format message with variables
  const formatMessage = useCallback(
    (key: string, variables?: Record<string, string | number>) => {
      return t(key, variables)
    },
    [t]
  )

  return {
    // Current locale
    locale,

    // Translation function
    t,
    translate,
    formatMessage,
    pluralize,

    // Locale management
    changeLocale,
    getAvailableLocales,
    getLanguageName,

    // i18n instance
    i18n,

    // Initialization state
    isReady,
  }
}