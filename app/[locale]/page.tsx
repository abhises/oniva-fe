'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import { FiMapPin, FiCheck, FiSmartphone, FiAward, FiArrowRight } from 'react-icons/fi'
import { Button } from '@/components/common/Button'
import dynamic from "next/dynamic";

const SenegalMap = dynamic(
  () => import("@/components/common/SenegalMap"),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-blue-50 animate-pulse rounded-xl" />
  }
);

export default function LandingPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const { isAuthenticated, user } = useAuth()
  const { t, isReady } = useTranslation()

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user && isReady) {
      const targetPath = `/${locale}/${user.role.toLowerCase()}/dashboard`;
      router.push(targetPath);
    }
  }, [isAuthenticated, user, locale, router, isReady])

  

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-entrance">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-medium text-gray-900 leading-tight">
                  {t('landing.heroTitle')}
                </h1>
                <p className="text-xl text-gray-600 animate-entrance delay-100">
                  {t('landing.heroSubtitle')}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-entrance delay-200">
                <Link href={`/${locale}/register?role=client`}>
                  <Button className="btn-premium w-full sm:w-auto">
                    {t('landing.bookRide')}
                    <FiArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link href={`/${locale}/login`}>
                  <Button variant="outline" className="w-full sm:w-auto px-8">
                    {t('landing.signIn')}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                <div>
                  <p className="text-3xl font-medium text-blue-600">1,250+</p>
                  <p className="text-gray-600 text-sm">
                    {t('landing.statsUsers')}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-medium text-blue-600">342</p>
                  <p className="text-gray-600 text-sm">
                    {t('landing.statsDrivers')}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-medium text-blue-600">5.6K</p>
                  <p className="text-gray-600 text-sm">
                    {t('landing.statsTrips')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image/Visual */}
            <div className="block mt-12 md:mt-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl opacity-10 blur-3xl"></div>
                <div className="relative bg-white rounded-2xl p-4 md:p-8 shadow-xl">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <SenegalMap />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-normal text-center mb-16 text-gray-900">
            {t('landing.featuresTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-modern shadow-premium-hover animate-entrance delay-200 flex flex-col items-center text-center">
              <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mb-6">
                <FiSmartphone className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-normal text-gray-900 mb-4">
                {t('landing.feature1Title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('landing.feature1Desc')}
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold px-4 py-2 bg-blue-50 rounded-full text-sm">
                <FiCheck className="w-5 h-5" />
                {t('landing.feature1Check')}
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-modern shadow-premium-hover animate-entrance delay-300 flex flex-col items-center text-center">
              <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mb-6">
                <FiAward className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-normal text-gray-900 mb-4">
                {t('landing.feature2Title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('landing.feature2Desc')}
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold px-4 py-2 bg-emerald-50 rounded-full text-sm">
                <FiCheck className="w-5 h-5" />
                {t('landing.feature2Check')}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-modern shadow-premium-hover animate-entrance delay-400 flex flex-col items-center text-center">
              <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                <FiMapPin className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-normal text-gray-900 mb-4">
                {t('landing.feature3Title')}
              </h3>
              <p className="text-gray-600 mb-6 font-light">
                {t('landing.feature3Desc')}
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600 font-medium px-4 py-2 bg-purple-50 rounded-full text-sm">
                <FiCheck className="w-5 h-5" />
                {t('landing.feature3Check')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            {t('landing.howItWorksTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                title: t('landing.step1Title'),
                desc: t('landing.step1Desc'),
                number: '1',
              },
              {
                title: t('landing.step2Title'),
                desc: t('landing.step2Desc'),
                number: '2',
              },
              {
                title: t('landing.step3Title'),
                desc: t('landing.step3Desc'),
                number: '3',
              },
              {
                title: t('landing.step4Title'),
                desc: t('landing.step4Desc'),
                number: '4',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.desc}
                </p>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-4xl text-gray-300">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-xl text-blue-100">
            {t('landing.ctaDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/register?role=client`} className="w-full sm:w-auto">
              <Button className="bg-blue-600 text-blue-600 hover:bg-gray-100 hover:text-blue-700 w-full !shadow-sm !py-3 !px-6 !text-lg">
                {t('landing.ctaBookNow')}
              </Button>
            </Link>
            <Link href={`/${locale}/register?role=driver`} className="w-full sm:w-auto">
              <Button className="bg-transparent border border-white text-white hover:bg-white hover:text-blue-600 w-full !shadow-sm !py-3 !px-6 !text-lg">
                {t('landing.ctaBecomeDriver')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">
                {t('landing.footerAbout')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerAboutUs')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerSafety')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {t('landing.footerService')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerForClients')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerForDrivers')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {t('landing.footerSupport')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerHelpCenter')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerContactUs')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {t('landing.footerLegal')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerPrivacy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t('landing.footerTerms')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              &copy; 2024 ONIVA.{' '}
              {t('landing.footerRightsReserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}