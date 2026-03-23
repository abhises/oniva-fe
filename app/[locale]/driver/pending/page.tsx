// app/driver/pending/page.tsx
'use client'

import { Clock, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function PendingVerificationPage() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Profile Under Review
        </h1>
        <p className="text-gray-600 mb-8">
          Thanks for joining ONIVA! Our team is currently verifying your documents. 
          This usually takes 24-48 hours.
        </p>

        <div className="space-y-4 text-left bg-blue-50 p-4 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800">We will notify you via SMS/Email once approved.</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}