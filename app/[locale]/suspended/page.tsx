"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function SuspendedPage() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const logout = useAuthStore((state) => state.logout);

  // Clear any existing auth state just in case they arrived here by other means
  useEffect(() => {
    logout();
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=None; Secure";
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 text-center border-t-4 border-red-500 animate-in zoom-in-95 duration-300">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
          <FiAlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
          {t('common.accountSuspended', 'Account Suspended')}
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed text-sm">
          {t('common.accountSuspendedMsg', 'Your account has been suspended due to restricted activity or a violation of our policies. Please contact the administration team to review your account status.')}
        </p>

        <div className="space-y-3">
          <a
            href="mailto:support@oniva.com"
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {t('common.contactSupport', 'Contact Administrator')}
          </a>
          <Link
            href={`/${locale}`}
            className="w-full flex justify-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          >
            {t('common.returnToHome', 'Return to Homepage')}
          </Link>
        </div>
      </div>
    </div>
  );
}
