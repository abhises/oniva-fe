'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import { FiMapPin, FiCheck, FiSmartphone, FiAward, FiArrowRight } from 'react-icons/fi'
import dynamic from "next/dynamic";

const SenegalMap = dynamic(
  () => import("@/components/common/SenegalMap"),
  { ssr: false }
);

export default function LandingPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const { isAuthenticated, user } = useAuth()
  const { t } = useTranslation()

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/${locale}/${user.role}/dashboard`)
    }
  }, [isAuthenticated, user, locale, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  {locale === 'en' 
                    ? 'Your Trusted Personal Driver' 
                    : 'Votre Chauffeur Personnel de Confiance'}
                </h1>
                <p className="text-xl text-gray-600">
                  {locale === 'en'
                    ? 'Professional, verified drivers ready to serve you anytime, anywhere.'
                    : 'Chauffeurs professionnels et vérifiés prêts à vous servir à tout moment.'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${locale}/register?role=client`}>
                  <button className="bg-blue-600 text-white rounded-lg p-2 hover:scale-105 hover:bg-blue-800 btn-lg w-full border-none sm:w-auto flex items-center justify-center gap-2">
                    {locale === 'en' ? 'Book a Ride' : 'Réserver un Trajet'}
                    <FiArrowRight />
                  </button>
                </Link>
                <Link href={`/${locale}/login`}>
                  <button className="bg-blue-600 text-white rounded-lg p-2 hover:scale-105 hover:bg-blue-800  border-none btn-lg w-full sm:w-auto">
                    {locale === 'en' ? 'Sign In' : 'Se Connecter'}
                  </button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div>
                  <p className="text-3xl font-bold text-blue-600">1,250+</p>
                  <p className="text-gray-600 text-sm">
                    {locale === 'en' ? 'Users' : 'Utilisateurs'}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">342</p>
                  <p className="text-gray-600 text-sm">
                    {locale === 'en' ? 'Drivers' : 'Chauffeurs'}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">5.6K</p>
                  <p className="text-gray-600 text-sm">
                    {locale === 'en' ? 'Trips' : 'Trajets'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image/Visual */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl opacity-10 blur-3xl"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    {/* <FiMapPin className="w-32 h-32 text-blue-600" /> */}
                    <SenegalMap/>
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
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            {locale === 'en' ? 'Why Choose ONIVA?' : 'Pourquoi Choisir ONIVA?'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiSmartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {locale === 'en' ? 'Easy Booking' : 'Réservation Facile'}
              </h3>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'Book a driver in seconds with our mobile app. Simple, fast, and reliable.'
                  : 'Réservez un chauffeur en quelques secondes avec notre application mobile.'}
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <FiCheck className="w-5 h-5" />
                {locale === 'en' ? 'Available 24/7' : 'Disponible 24h/24'}
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <FiAward className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {locale === 'en' ? 'Verified Drivers' : 'Chauffeurs Vérifiés'}
              </h3>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'All drivers are thoroughly verified and rated by our community.'
                  : 'Tous les chauffeurs sont vérifiés et évalués par notre communauté.'}
              </p>
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <FiCheck className="w-5 h-5" />
                {locale === 'en' ? 'Background Checked' : 'Vérifiés'}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiMapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {locale === 'en' ? 'Real-time Tracking' : 'Suivi en Temps Réel'}
              </h3>
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'Track your driver in real-time and stay connected throughout your journey.'
                  : 'Suivez votre chauffeur en temps réel pendant tout le trajet.'}
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-semibold">
                <FiCheck className="w-5 h-5" />
                {locale === 'en' ? 'GPS Enabled' : 'GPS Activé'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            {locale === 'en' ? 'How It Works' : 'Comment Ça Marche'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                en: 'Sign Up',
                fr: 'S\'inscrire',
                desc_en: 'Create your account in minutes',
                desc_fr: 'Créez votre compte en quelques minutes',
                number: '1',
              },
              {
                en: 'Book',
                fr: 'Réserver',
                desc_en: 'Enter your destination',
                desc_fr: 'Entrez votre destination',
                number: '2',
              },
              {
                en: 'Confirm',
                fr: 'Confirmer',
                desc_en: 'Driver accepts your request',
                desc_fr: 'Le chauffeur accepte votre demande',
                number: '3',
              },
              {
                en: 'Enjoy',
                fr: 'Profiter',
                desc_en: 'Relax and enjoy your ride',
                desc_fr: 'Détendez-vous et profitez du trajet',
                number: '4',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {locale === 'en' ? step.en : step.fr}
                </h3>
                <p className="text-gray-600">
                  {locale === 'en' ? step.desc_en : step.desc_fr}
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
            {locale === 'en'
              ? 'Ready to Get Started?'
              : 'Prêt à Commencer?'}
          </h2>
          <p className="text-xl text-blue-100">
            {locale === 'en'
              ? 'Join thousands of satisfied customers. Download the app or sign up online today.'
              : 'Rejoignez des milliers de clients satisfaits. Téléchargez l\'application dès maintenant.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/register?role=client`}>
              <button className="btn bg-white text-blue-600 hover:bg-gray-100 btn-lg w-full sm:w-auto">
                {locale === 'en' ? 'Book Now' : 'Réserver Maintenant'}
              </button>
            </Link>
            <Link href={`/${locale}/register?role=driver`}>
              <button className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-600 btn-lg w-full sm:w-auto">
                {locale === 'en' ? 'Become a Driver' : 'Devenir Chauffeur'}
              </button>
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
                {locale === 'en' ? 'About' : 'À Propos'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'About Us' : 'Qui Sommes Nous'}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'Safety' : 'Sécurité'}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {locale === 'en' ? 'Service' : 'Service'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'For Clients' : 'Pour Clients'}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'For Drivers' : 'Pour Chauffeurs'}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {locale === 'en' ? 'Support' : 'Support'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'Help Center' : 'Centre d\'Aide'}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'Contact Us' : 'Nous Contacter'}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">
                {locale === 'en' ? 'Legal' : 'Légal'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'Privacy' : 'Confidentialité'}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {locale === 'en' ? 'Terms' : 'Conditions'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              &copy; 2024 ONIVA.{' '}
              {locale === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}